const Card = require('./Card');


class Baron extends Card {

  constructor() {
    super(3, 'Baron');
  }

  canPlayWith() {
    return true;
  }

  getValidTargets(players) {
    return players.filter(this._isValidTargetPlayer);
  }

  play(events, player, targetPlayer) {
    if (!targetPlayer) {
      events.createCardNoEffectEvent('Baron');
      return;
    }

    const playerCard = player.getHandCards()[0];
    const targetPlayerCard = targetPlayer.getHandCards()[0];

    // Reveal card of the other player

    events.createPrivateCompareCardsEvent(
      player.getName(),
      targetPlayer.getName()
    );

    events.createPrivateCardRevealEvent(
      player.getName(),
      targetPlayer.getName(),
      targetPlayerCard.getName()
    );

    events.createPrivateCardRevealEvent(
      targetPlayer.getName(),
      player.getName(),
      playerCard.getName()
    );

    if (playerCard.getValue() > targetPlayerCard.getValue()) {
      targetPlayer.removeFromRound();

      events.createOutOfRoundEvent(
        targetPlayer.getName(),
        targetPlayer.getTopTableCard().getName()
      );
    } else if (playerCard.getValue() < targetPlayerCard.getValue()) {
      player.removeFromRound();

      events.createOutOfRoundEvent(
        player.getName(),
        player.getTopTableCard().getName()
      );
    } else {
      events.createCardNoEffectEvent('Baron');
    }
  }

  _isValidTargetPlayer(player) {
    // Can target others that are not protected and in game but not self
    return !player.isProtected() &&
           !player.isCurrentPlayer() &&
           !player.isOutOfRound();
  }

}


module.exports = Baron;
