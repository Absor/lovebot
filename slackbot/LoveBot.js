const winston = require('winston');
const fetch = require('node-fetch');
const WebSocket = require('ws');

const Game = require('../lib/Game');
const ThrottleSender = require('./ThrottleSender');
const EventTransformer = require('./EventTransformer');
const DumbBot = require('./DumbBot');


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

    if (event.type === 'gameStatus') {
      this._bots.forEach(bot => bot.updateGameStatus(event));
    }

    if (event.type === 'privateStatus') {
      const recipient = event.for[0];
      const botUser = this._bots.find(bot => bot.getName() === recipient);

      if (botUser && event.isCurrentPlayer) {
        this.logger.info(`Game event given to bot ${botUser.getName()}.`);
        const cardPlay = botUser.getCardPlay(event);

        this._game.playCardAsPlayer(
          botUser.getName(),
          cardPlay.cardName,
          cardPlay.cardTarget,
          cardPlay.cardChoice
        );
        return;
      }
    }

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
    const messageParts = [
      '*Commands*',
      '*cards* to show a summary of cards.',
      '*join* to join a game.',
      '*start* to start a game you have joined.',
      '*play <cardname> <target player name> <card choice>* ' +
        'to play a card when it is your turn.',
      '*addbot* to add a bot player to a game you have joined.',
    ];

    this._sendMessageToImChannel(imChannel, messageParts.join('\n'));
  }

  _onCards(imChannel) {
    const attachments = [
      {
        title: '8 - Princess (1)',
        text: 'If you discard this card, you are out of the round.',
        color: '#0033FF',
      },
      {
        title: '7 - Countess (1)',
        text: [
          'If you have this card and the King or Prince in your hand,',
          'you must discard this card.',
        ].join(' '),
        color: '#0066FF',
      },
      {
        title: '6 - King (1)',
        text: 'Trade hands with another player of your choice.',
        color: '#0099FF',
      },
      {
        title: '5 - Prince (2)',
        text: [
          'Choose any player including yourself to',
          'discard his or her hand and draw a new card.',
        ].join(' '),
        color: '#00CCFF',
      },
      {
        title: '4 - Handmaid (2)',
        text: [
          'Until your next turn,',
          'ignore all effects from other player\'s cards.',
        ].join(' '),
        color: '#00FFCC',
      },
      {
        title: '3 - Baron (2)',
        text: [
          'You and another player secretly compare hands.',
          'The player with the lower value is out of the round.',
        ].join(' '),
        color: '#00FF99',
      },
      {
        title: '2 - Priest (2)',
        text: 'Look at a another player\'s hand.',
        color: '#00FF66',
      },
      {
        title: '1 - Guard (5)',
        text: [
          'Name a non-Guard card and choose another player.',
          'If that player has that card, he or she is out of the round.',
        ].join(' '),
        color: '#00FF33',
      },
    ];

    this._sendMessageToImChannel(imChannel, '*List of cards*', attachments);
  }

  _onJoin(imChannel, username) {
    this.logger.info(`Game join command attempt by ${username}`);

    if (this._game.hasPlayerWithName(username)) {
      let message = 'You are already in the game';
      if (!this._game.hasStarted()) {
        message += '. Write *start* to start the game.';
      } else {
        message += ' and the game has started. Write *play <cardname> ' +
                   '<target player name> <card choice>* ' +
                   'to play a card when it is your turn.';
      }
      this._sendMessageToImChannel(imChannel, message);
      this.logger.error(
        `Game join command failed because ${username} is already in the game`
      );
      return;
    }

    if (this._game.hasStarted()) {
      this._sendMessageToImChannel(
        imChannel,
        'The current game has already started. Wait until a new game begins.'
      );
      this.logger.error(
        `Game join command by ${username} failed because the game has started.`
      );
      return;
    }

    if (this._game.isFull()) {
      this._sendMessageToImChannel(
        imChannel,
        'The current game is full. Wait until a new game begins.'
      );
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
        imChannel,
        'You have to be in the game to add a bot. ' +
        'Write *join* to join the game.'
      );
      this.logger.error(
        `Add bot command by ${username} failed ` +
        'because the user is not in the game.'
      );
      return;
    }

    if (this._game.hasStarted()) {
      this._sendMessageToImChannel(
        imChannel,
        'The current game has already started. Wait until a new game begins.'
      );
      this.logger.error(
        `Bot add command by ${username} failed because the game has started.`
      );
      return;
    }

    if (this._game.isFull()) {
      this._sendMessageToImChannel(
        imChannel,
        'The current game is full. Wait until a new game begins.'
      );
      this.logger.error(
        `Bot add command by ${username} failed because the game is full.`
      );
      return;
    }

    const bot = new DumbBot();
    while (this._game.hasPlayerWithName(bot.getName())) {
      bot.generateNewName();
    }
    this._bots.push(bot);
    this._game.joinGameAsPlayer(bot.getName());
  }

  _onStart(imChannel, username) {
    this.logger.info(`Game start command attempt by ${username}`);
    if (!this._game.hasPlayerWithName(username)) {
      this._sendMessageToImChannel(
        imChannel,
        'You are not in the game. Write *join* to join the game.'
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
        imChannel,
        'You are not in the game. Write *join* to join the game.'
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
