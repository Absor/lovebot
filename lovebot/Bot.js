class Bot {

  constructor(logger, name, game) {
    this.logger = logger;
    this._name = name;
    this._game = game;

    this.GUARD_TARGET_CARDS = [
      'Priest',
      'Priest',
      'Baron',
      'Baron',
      'Handmaid',
      'Handmaid',
      'Prince',
      'Prince',
      'King',
      'Countess',
      'Princess',
    ];

    this.ALL_CARDS = [
      'Guard',
      'Guard',
      'Guard',
      'Guard',
      'Guard',
      'Priest',
      'Priest',
      'Baron',
      'Baron',
      'Handmaid',
      'Handmaid',
      'Prince',
      'Prince',
      'King',
      'Countess',
      'Princess',
    ];

    /* eslint-disable quote-props */
    // Quoted keys are clearer in this case
    this.CARD_VALUES = {
      'Guard': 1,
      'Priest': 2,
      'Baron': 3,
      'Handmaid': 4,
      'Prince': 5,
      'King': 6,
      'Countess': 7,
      'Princess': 8,
    };
    /* eslint-enable quote-props */

    this._processEvent = this._processEvent.bind(this);
    this._game.on('event', this._processEvent);
  }

  static getType() {
    throw Error('Bot getType not implemented.');
  }

  getName() {
    return this._name;
  }

  getGame() {
    return this._game;
  }

  _processEvent(event) {
    const isNotForBot = event.for.indexOf(this.getName()) === -1;
    if (isNotForBot) return;

    const handler = this[event.type];

    if (handler) {
      handler.call(this, event);
    } else {
      this.logger.warn(
        `Bot ${this._name} has no event handler for ${event.type}.`
      );
    }
  }

}


module.exports = Bot;
