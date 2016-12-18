const Game = require('../lib/Game');
const EventTransformer = require('./EventTransformer');
const responses = require('./responses');

const DumbBot = require('./bots/DumbBot');
const SmartBot = require('./bots/SmartBot');


const BOT_TYPES = {
  [DumbBot.getType()]: DumbBot,
  [SmartBot.getType()]: SmartBot,
};


class LoveBot {

  constructor(logger, slackBot, database) {
    this.logger = logger;
    this._slackBot = slackBot;
    this._db = database;

    this._onGameEvent = this._onGameEvent.bind(this);
    this._onPrivateMessage = this._onPrivateMessage.bind(this);

    this._game = null;
    this._bots = [];
    this._resetGame();

    this._slackBot.on('private', this._onPrivateMessage);

    this._eventTransformer = new EventTransformer();
  }

  async start() {
    this._db.initialize();
    await this._slackBot.connect();
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

        this.logger.info(`Game event send to ${recipient} started`, newEvent);
        this._sendMessageToUsername(
          recipient,
          newEvent.text,
          newEvent.attachments
        );
      });
    });

    if (event.type === 'gameEnd') {
      this._db.saveGame(event.winner, this._game.getRecord());
      this._resetGame();
    }
  }

  _sendMessageToUsername(username, text, attachments) {
    this._slackBot.sendMessage(username, text, attachments);
  }

  _onPrivateMessage(message) {
    this.logger.info('Received message', message);

    const username = message.username;
    const command = message.text.trim().toLowerCase().split(' ');

    switch (command[0]) {
      case 'help':
        this._onHelp(username);
        break;
      case 'cards':
        this._onCards(username);
        break;
      case 'join':
        this._onJoin(username);
        break;
      case 'start':
        this._onStart(username);
        break;
      case 'play':
        this._onPlay(username, command[1], command[2], command[3]);
        break;
      case 'addbot':
        this._onAddBot(username, command[1]);
        break;
      case 'stats':
        this._onStats(username);
        break;
      default:
        break;
    }
  }

  _onHelp(username) {
    this._sendMessageToUsername(username, responses.static.commands.text);
  }

  _onCards(username) {
    const listOfCards = responses.static.listOfCards;
    this._sendMessageToUsername(
      username, listOfCards.text, listOfCards.attachments
    );
  }

  _onJoin(username) {
    this.logger.info(`Game join command attempt by ${username}`);

    if (this._game.hasPlayerWithName(username)) {
      const message = responses.dynamic.alreadyInGameJoin(
        this._game.hasStarted()
      );
      this._sendMessageToUsername(username, message.text);
      this.logger.error(
        `Game join command failed because ${username} is already in the game`
      );
      return;
    }

    if (this._game.hasStarted()) {
      this._sendMessageToUsername(
        username, responses.static.alreadyStartedJoin.text
      );
      this.logger.error(
        `Game join command by ${username} failed because the game has started.`
      );
      return;
    }

    if (this._game.isFull()) {
      this._sendMessageToUsername(
        username, responses.static.gameFullJoin.text
      );
      this.logger.error(
        `Game join command by ${username} failed because the game is full.`
      );
      return;
    }

    this.logger.info(`Game join command by ${username}`);
    this._game.joinGameAsPlayer(username);
  }

  _onAddBot(username, botType) {
    if (!this._game.hasPlayerWithName(username)) {
      this._sendMessageToUsername(
        username, responses.static.notInGameAddBot.text
      );
      this.logger.error(
        `Add bot command by ${username} failed ` +
        'because the user is not in the game.'
      );
      return;
    }

    if (this._game.hasStarted()) {
      this._sendMessageToUsername(
        username, responses.static.alreadyStartedAddBot.text
      );
      this.logger.error(
        `Bot add command by ${username} failed because the game has started.`
      );
      return;
    }

    if (this._game.isFull()) {
      this._sendMessageToUsername(
        username, responses.static.gameFullAddBot.text
      );
      this.logger.error(
        `Bot add command by ${username} failed because the game is full.`
      );
      return;
    }

    if (!botType) {
      this._sendMessageToUsername(
        username,
        responses.dynamic.noBotTypeAddBot(Object.keys(BOT_TYPES)).text
      );
      this.logger.error(
        `Bot add command by ${username} failed because bot type was not given.`
      );
      return;
    }

    const Bot = BOT_TYPES[botType];

    if (!Bot) {
      this._sendMessageToUsername(
        username,
        responses.dynamic.badBotTypeAddBot(
          botType, Object.keys(BOT_TYPES)
        ).text
      );
      this.logger.error(
        `Bot add command by ${username} failed`,
        `because there is no bot of type ${botType}.`
      );
      return;
    }

    let name = this._generateBotName();
    while (this._game.hasPlayerWithName(name)) {
      name = this._generateBotName();
    }

    const bot = new Bot(this.logger, name, this._game);

    this._bots.push(bot);
    this._game.joinGameAsPlayer(bot.getName());
  }

  _onStart(username) {
    this.logger.info(`Game start command attempt by ${username}`);
    if (!this._game.hasPlayerWithName(username)) {
      this._sendMessageToUsername(
        username, responses.static.notInGameStart.text
      );
      this.logger.error(
        `Game start command failed because ${username} is not in the game`
      );
      return;
    }

    this.logger.info(`Game start command by ${username}`);
    this._game.startGameAsPlayer(username);
  }

  _onPlay(username, c1, c2, c3) {
    this.logger.info(`Game play command attempt by ${username}`);
    if (!this._game.hasPlayerWithName(username)) {
      this._sendMessageToUsername(
        username, responses.static.notInGamePlay.text
      );
      this.logger.error(
        `Game play command failed because ${username} is not in the game`
      );
      return;
    }

    this.logger.info(`Game play command by ${username}`);
    this._game.playCardAsPlayer(username, c1, c2, c3);
  }

  _onStats(username) {
    this._db.getWinners().then((winners) => {
      const response = responses.dynamic.stats(winners);
      this._sendMessageToUsername(
        username, response.text, response.attachments
      );
    });
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

}


module.exports = LoveBot;
