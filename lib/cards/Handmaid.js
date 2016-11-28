const Card = require('./Card');


class Handmaid extends Card {

  constructor() {
    super(4, 'Handmaid');
  }

  canPlayWith() {
    return true;
  }

  getValidTargets() {
    return [];
  }

  play(events, player) {
    player.setProtected(true);
    events.createProtectionStartEvent(player.getName());
  }

}


module.exports = Handmaid;
