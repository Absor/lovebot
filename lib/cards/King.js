const Card = require('./Card');
const Countess = require('./Countess');


class King extends Card {

  constructor() {
    super(6, 'King');
  }

  canPlayWith(otherCard) {
    return !(otherCard instanceof Countess);
  }

  getValidTargets(players) {
    return players.filter(this._isValidTargetPlayer);
  }

  play(events, player, targetPlayer) {
    if (!targetPlayer) {
      events.createCardNoEffectEvent('King');
      return;
    }

    const playerCard = player.getHandCards()[0];
    player.removeHandCard(playerCard);
    const targetPlayerCard = targetPlayer.getHandCards()[0];
    targetPlayer.removeHandCard(targetPlayerCard);

    player.giveCard(targetPlayerCard);
    targetPlayer.giveCard(playerCard);

    events.createTradeEvent(player.getName(), targetPlayer.getName());

    events.createReceiveCardEvent(
      player.getName(),
      targetPlayer.getName(),
      targetPlayerCard.getName()
    );

    events.createReceiveCardEvent(
      targetPlayer.getName(),
      player.getName(),
      playerCard.getName()
    );
  }

  _isValidTargetPlayer(player) {
    // Can target others that are not protected and in game but not self
    return !player.isProtected() &&
           !player.isCurrentPlayer() &&
           !player.isOutOfRound();
  }

}


module.exports = King;
