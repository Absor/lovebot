const GUARD_CHOICES = [
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


class DumbBot {

  constructor() {
    this._id = null;
    this._status = null;

    this.generateNewName();
  }

  generateNewName() {
    this._id = '';

    const possibleC = 'bcdfghjklmnpqrstvwxz';
    const possibleV = 'aeiouy';

    for (let i = 1; i <= 4; i += 1) {
      let possible = possibleC;
      if (i === 2 || i === 4) {
        possible = possibleV;
      }
      this._id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }

  updateGameStatus(status) {
    this._status = status;
  }

  getCardPlay(privateStatus) {
    const canPlayCards = privateStatus.cardsInHand.filter(c => c.canPlay);

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
      cardChoice = GUARD_CHOICES[
        Math.floor(Math.random() * GUARD_CHOICES.length)
      ];
    }

    return {
      cardName,
      cardTarget,
      cardChoice,
    };
  }

  getName() {
    return `bot_${this._id}`;
  }

}


module.exports = DumbBot;
