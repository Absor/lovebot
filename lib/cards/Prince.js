const Card = require('./Card');
const Countess = require('./Countess');
const Princess = require('./Princess');


class Prince extends Card {

  constructor() {
    super(5, 'Prince');
  }

  canPlayWith(otherCard) {
    return !(otherCard instanceof Countess);
  }

  getValidTargets(players) {
    return players.filter(this._isValidTargetPlayer);
  }

  play(events, player, targetPlayer) {
    const targetPlayerCard = targetPlayer.getHandCards()[0];

    if (targetPlayerCard instanceof Princess) {
      targetPlayer.removeFromRound();

      events.createOutOfRoundEvent(
        targetPlayer.getName(), targetPlayer.getTopTableCard().getName()
      );
    } else {
      targetPlayer.tableCard(targetPlayerCard);

      events.createCardDiscardEvent(
        targetPlayer.getName(), targetPlayerCard.getName()
      );
    }
  }

  _isValidTargetPlayer(player) {
    // Can target others that are not protected and in game, also self
    return !player.isProtected() &&
           !player.isOutOfRound();
  }

}


module.exports = Prince;
