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

  constructor(name, game) {
    this._name = name;
    this._game = game;
    this._id = null;
    this._status = null;
    this._game.on('event', this._processEvent.bind(this));
  }

  _processEvent(event) {
    const handler = this[event.type];

    if (handler) {
      handler(event);
    }
  }

  ['privateStatus'](event) {
    const recipient = event.for[0];
    if (recipient !== this._name) return;

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
      cardChoice = GUARD_CHOICES[
        Math.floor(Math.random() * GUARD_CHOICES.length)
      ];
    }

    this._game.playCardAsPlayer(
      this._name,
      cardName,
      cardTarget,
      cardChoice
    );
  }
}


module.exports = DumbBot;
