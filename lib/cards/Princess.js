const Card = require('./Card');


class Princess extends Card {

  constructor() {
    super(8, 'Princess');
  }

  canPlayWith() {
    return true;
  }

  getValidTargets() {
    return [];
  }

  play(events, player) {
    player.removeFromRound();

    events.createOutOfRoundEvent(
      player.getName(), player.getTopTableCard().getName()
    );
  }

}


module.exports = Princess;
