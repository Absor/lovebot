const Card = require('./Card');


class Guard extends Card {

  constructor() {
    super(1, 'Guard');
  }

  canPlayWith() {
    return true;
  }

  getValidTargets(players) {
    return players.filter(this._isValidTargetPlayer);
  }

  play(events, player, targetPlayer, cardChoice) {
    if (!targetPlayer) {
      events.createCardNoEffectEvent('Guard');
      return;
    }

    const targetCardInHand = targetPlayer.getHandCardByName(cardChoice);

    if (targetCardInHand) {
      targetPlayer.removeFromRound();

      events.createOutOfRoundEvent(
        targetPlayer.getName(),
        targetPlayer.getTopTableCard().getName()
      );
    } else {
      events.createCardNoEffectEvent('Guard');
    }
  }

  _isValidTargetPlayer(player) {
    // Can target others that are not protected and in game but not self
    return !player.isProtected() &&
           !player.isCurrentPlayer() &&
           !player.isOutOfRound();
  }

}


module.exports = Guard;
