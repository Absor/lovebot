const Card = require('./Card');


class Countess extends Card {

  constructor() {
    super(7, 'Countess');
  }

  canPlayWith() {
    return true;
  }

  getValidTargets() {
    return [];
  }

  play(events) {
    events.createCardNoEffectEvent('Countess');
  }

}


module.exports = Countess;
