const Bot = require('../Bot');


class DumbBot extends Bot {

  ['privateStatus'](event) {
    if (!event.isCurrentPlayer) return;

    const recipient = event.for[0];
    if (recipient !== this.getName()) return;

    const canPlayCards = event.cardsInHand.filter(c => c.canPlay);

    // Prioritize non Princess cards
    let cardsToPlay = canPlayCards.filter(card => card.name !== 'Princess');

    if (cardsToPlay.length === 0) {
      cardsToPlay = canPlayCards;
    }

    const cardToPlay = cardsToPlay[
      Math.floor(Math.random() * cardsToPlay.length)
    ];

    const cardName = cardToPlay.name;

    // Prioritize other targets
    let validTargets = cardToPlay.validTargetPlayers;

    if (validTargets.length > 0) {
      validTargets = validTargets.filter(target => target !== this.getName());

      if (validTargets.length === 0) {
        validTargets = cardToPlay.validTargetPlayers;
      }
    }

    let cardTarget = null;

    if (cardToPlay.validTargetPlayers.length > 0) {
      cardTarget = validTargets[
        Math.floor(Math.random() * validTargets.length)
      ];
    }

    let cardChoice = null;

    if (cardTarget && cardName === 'Guard') {
      cardChoice = this.GUARD_TARGET_CARDS[
        Math.floor(Math.random() * this.GUARD_TARGET_CARDS.length)
      ];
    }

    this.getGame().playCardAsPlayer(
      this.getName(),
      cardName,
      cardTarget,
      cardChoice
    );
  }
}


module.exports = DumbBot;
