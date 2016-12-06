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

    this._processEvent = this._processEvent.bind(this);
    this._game.on('event', this._processEvent);
  }

  getName() {
    return this._name;
  }

  getGame() {
    return this._game;
  }

  _processEvent(event) {
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
