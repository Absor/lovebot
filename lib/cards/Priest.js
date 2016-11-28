const Card = require('./Card');


class Priest extends Card {

  constructor() {
    super(2, 'Priest');
  }

  canPlayWith() {
    return true;
  }

  getValidTargets(players) {
    // Can target others that are not protected and in game but not self
    return players.filter(this._isValidTargetPlayer);
  }

  play(events, player, targetPlayer) {
    if (!targetPlayer) {
      events.createCardNoEffectEvent('Priest');
      return;
    }

    events.createPrivateCardRevealEvent(
      player.getName(),
      targetPlayer.getName(),
      targetPlayer.getHandCards()[0].getName()
    );

    events.createPrivateCardShowEvent(
      targetPlayer.getName(), player.getName()
    );
  }

  _isValidTargetPlayer(player) {
    return !player.isProtected() &&
           !player.isCurrentPlayer() &&
           !player.isOutOfRound();
  }

}


module.exports = Priest;
