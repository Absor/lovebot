const winston = require('winston');
const fetch = require('node-fetch');
const WebSocket = require('ws');

const Game = require('../lib/Game');
const ThrottleSender = require('./ThrottleSender');
const EventTransformer = require('./EventTransformer');
const DumbBot = require('./DumbBot');
const responses = require('./responses');


class LoveBot {

  constructor(token) {
    this._token = token;

    this.logger = new winston.Logger({
      transports: [
        new (winston.transports.Console)(),
      ],
    });

    this._onGameEvent = this._onGameEvent.bind(this);

    this._game = null;
    this._bots = [];
    this._resetGame();

    this._ws = null;
    this._sender = null;

    this._ims = null;
    this._users = null;
    this._self = null;

    this._eventTransformer = new EventTransformer();
  }

  async start() {
    const response = await fetch(
      `https://slack.com/api/rtm.start?token=${this._token}`
    );

    const slackData = await response.json();
    this._ims = slackData.ims;
    this._users = slackData.users;
    this._self = slackData.self;

    const url = slackData.url;
    this._ws = new WebSocket(url);

    this._sender = new ThrottleSender(this.logger, this._ws, this._token);

    this._ws.on('open', () => {
      this.logger.info('LoveBot started');
    });

    this._ws.on('message', (data) => {
      const message = JSON.parse(data);
      this._onBotMessage(message);
    });

    this._ws.on('close', () => {
      this.logger.error('WebSocket connection closed, exiting.');
      process.exit(1);
    });
  }

  _resetGame() {
    if (this._game) {
      this._game.removeListener('event', this._onGameEvent);
      this._game.removeListener('error', this._onGameEvent);
      this._game = null;
      this._bots = [];
    }

    this._game = new Game();
    this._game.on('event', this._onGameEvent);
    this._game.on('error', this._onGameEvent);
  }

  _onGameEvent(event) {
    this.logger.info('Game event', event);

    let newEvents = null;
    try {
      newEvents = this._eventTransformer.transform(event);
    } catch (e) {
      this.logger.error(e);
      return;
    }

    this.logger.info('Transformed game events', newEvents);

    newEvents.forEach((newEvent) => {
      newEvent.for.forEach((recipient) => {
        const botUser = this._bots.find(bot => bot.getName() === recipient);

        if (botUser) return;

        const targetUser = this._users.find(user => user.name === recipient);
        const targetIm = this._ims.find(im => im.user === targetUser.id);

        this.logger.info(`Game event send to ${recipient} started`, newEvent);
        this._sendMessageToImChannel(
          targetIm,
          newEvent.text,
          newEvent.attachments
        );
      });
    });

    if (event.type === 'gameEnd') {
      this._resetGame();
    }
  }

  _sendMessageToImChannel(imChannel, text, attachments) {
    this._sender.sendMessage(imChannel, text, attachments);
  }

  _onBotMessage(message) {
    this.logger.info('Received message', message);

    if (message.type === 'team_join') {
      this._users.push(message.user);
      this.logger.info('New team member joined');
    }

    if (message.type === 'im_created') {
      this._ims.push(message.channel);
      this.logger.info('New direct message channel created');
    }

    if (message.type !== 'message') return;
    if (!message.user) return;
    if (message.hidden) return;
    if (message.user === this._self.id) return;

    const imChannel = this._ims.find(im => im.id === message.channel);
    if (!imChannel) return;

    const user = this._users.find(u => u.id === message.user);
    const username = user.name;
    const command = message.text.trim().toLowerCase().split(' ');

    switch (command[0]) {
      case 'help':
        this._onHelp(imChannel);
        break;
      case 'cards':
        this._onCards(imChannel);
        break;
      case 'join':
        this._onJoin(imChannel, username);
        break;
      case 'start':
        this._onStart(imChannel, username);
        break;
      case 'play':
        this._onPlay(imChannel, username, command[1], command[2], command[3]);
        break;
      case 'addbot':
        this._onAddBot(imChannel, username);
        break;
      default:
        // TODO: error message
    }
  }

  _onHelp(imChannel) {
    this._sendMessageToImChannel(imChannel, responses.static.commands.text);
  }

  _onCards(imChannel) {
    const listOfCards = responses.static.listOfCards;
    this._sendMessageToImChannel(
      imChannel, listOfCards.text, listOfCards.attachments
    );
  }

  _onJoin(imChannel, username) {
    this.logger.info(`Game join command attempt by ${username}`);

    if (this._game.hasPlayerWithName(username)) {
      const message = responses.dynamic.alreadyInGameJoin(
        this._game.hasStarted()
      );
      this._sendMessageToImChannel(imChannel, message.text);
      this.logger.error(
        `Game join command failed because ${username} is already in the game`
      );
      return;
    }

    if (this._game.hasStarted()) {
      this._sendMessageToImChannel(
        imChannel, responses.static.alreadyStartedJoin.text
      );
      this.logger.error(
        `Game join command by ${username} failed because the game has started.`
      );
      return;
    }

    if (this._game.isFull()) {
      this._sendMessageToImChannel(imChannel, responses.static.gameFullJoin);
      this.logger.error(
        `Game join command by ${username} failed because the game is full.`
      );
      return;
    }

    this.logger.info(`Game join command by ${username}`);
    this._game.joinGameAsPlayer(username);
  }

  _onAddBot(imChannel, username) {
    if (!this._game.hasPlayerWithName(username)) {
      this._sendMessageToImChannel(
        imChannel, responses.static.notInGameAddBot
      );
      this.logger.error(
        `Add bot command by ${username} failed ` +
        'because the user is not in the game.'
      );
      return;
    }

    if (this._game.hasStarted()) {
      this._sendMessageToImChannel(
        imChannel, responses.static.alreadyStartedAddBot
      );
      this.logger.error(
        `Bot add command by ${username} failed because the game has started.`
      );
      return;
    }

    if (this._game.isFull()) {
      this._sendMessageToImChannel(
        imChannel, responses.static.gameFullAddBot
      );
      this.logger.error(
        `Bot add command by ${username} failed because the game is full.`
      );
      return;
    }

    let name = this._generateBotName();
    while (this._game.hasPlayerWithName(name)) {
      name = this._generateBotName();
    }

    const bot = new DumbBot(name, this._game);

    this._bots.push(bot);
    this._game.joinGameAsPlayer(bot.getName());
  }

  _generateBotName() {
    let name = '';

    const possibleC = 'bcdfghjklmnpqrstvwxz';
    const possibleV = 'aeiouy';

    for (let i = 1; i <= 4; i += 1) {
      let possible = possibleC;
      if (i === 2 || i === 4) {
        possible = possibleV;
      }
      name += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return `bot_${name}`;
  }

  _onStart(imChannel, username) {
    this.logger.info(`Game start command attempt by ${username}`);
    if (!this._game.hasPlayerWithName(username)) {
      this._sendMessageToImChannel(
        imChannel, responses.static.notInGameStart
      );
      this.logger.error(
        `Game start command failed because ${username} is not in the game`
      );
      return;
    }

    this.logger.info(`Game start command by ${username}`);
    this._game.startGameAsPlayer(username);
  }

  _onPlay(imChannel, username, c1, c2, c3) {
    this.logger.info(`Game play command attempt by ${username}`);
    if (!this._game.hasPlayerWithName(username)) {
      this._sendMessageToImChannel(
        imChannel, responses.static.notInGamePlay
      );
      this.logger.error(
        `Game play command failed because ${username} is not in the game`
      );
      return;
    }

    this.logger.info(`Game play command by ${username}`);
    this._game.playCardAsPlayer(username, c1, c2, c3);
  }

}


module.exports = LoveBot;
