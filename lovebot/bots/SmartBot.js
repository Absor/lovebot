const Bot = require('../Bot');


class SmartBot extends Bot {

  constructor(logger, name, game) {
    super(logger, name, game);

    this._cards = {};
    this._gameStatus = null;
    this._handCardKnown = null;
  }

  static getType() {
    return 'smart';
  }

  ['roundStart']() {
    this._cards = {};
    this._gameStatus = null;
  }

  ['gameStatus'](event) {
    this._gameStatus = event;

    this._gameStatus.players.forEach((player) => {
      this._addPlayerCardBase(player.name);

      this._cards[player.name].tableCards = player.tableCards.slice(0);
    });
  }

  ['cardReveal'](event) {
    this._addPlayerCardBase(event.player);
    this._cards[event.player].handCards.push(event.card);

    this.logger.info(
      `${this.getName()} remembers that ${event.player} has ${event.card}`
    );
  }

  ['cardShow'](event) {
    if (event.player !== this.getName()) return;

    const knownCard = this._cards[this.getName()].handCards[0];
    this.logger.info(
      `${this.getName()} knows that ${event.target}`,
      `knows its hand card ${knownCard}`
    );
    this._handCardKnown = knownCard;
  }

  ['cardPlay'](event) {
    const { player, card } = event;
    this._addPlayerCardBase(player);

    const index = this._cards[player].handCards.indexOf(card);

    if (index > -1) {
      const handCards = this._cards[player].handCards;
      this._cards[player].handCards = handCards.splice(index, 1);

      this.logger.info(
        `${this.getName()} knows that ${player}`,
        `does not have ${card} anymore`
      );
    }
  }

  ['privateStatus'](event) {
    this._cards[this.getName()].handCards = event.cardsInHand.map(c => c.name);
    // Filter irrelevant input
    if (!event.isCurrentPlayer) return;

    const cardToPlay = this._getPreferredCard(event.cardsInHand);
    const cardName = cardToPlay.name;
    const cardTarget = this._getPreferredTarget(cardToPlay);
    const cardChoice = this._getPreferredChoice(cardToPlay, cardTarget);

    this.getGame().playCardAsPlayer(
      this.getName(),
      cardName,
      cardTarget,
      cardChoice
    );
  }

  _addPlayerCardBase(player) {
    if (this._cards[player]) return;

    this._cards[player] = {
      handCards: [],
      tableCards: [],
    };
  }

  _getPreferredCard(cardsInHand) {
    const canPlayCards = cardsInHand.slice(0).filter(c => c.canPlay);

    // If someone knows our card and we can play it, play it away
    if (this._handCardKnown) {
      const canPlayKnownCard = canPlayCards.find(
        c => c.name === this._handCardKnown
      );

      if (canPlayKnownCard) {
        this.logger.info(
          `${this.getName()} knows that someone else knows its hand`,
          'card and chooses to play the known card'
        );

        this._handCardKnown = null;
        return canPlayKnownCard;
      }
    }

    // Otherwise play the smalles value card
    canPlayCards.sort((c1, c2) => (
      this.CARD_VALUES[c1.name] - this.CARD_VALUES[c2.name]
    ));

    return canPlayCards[0];
  }

  _getPreferredTarget(cardToPlay) {
    let validTargets = cardToPlay.validTargetPlayers;

    if (cardToPlay.name === 'Guard') {
      const target = Object.keys(this._cards)
        .filter(playerName => validTargets.indexOf(playerName) !== -1)
        .find((playerName) => {
          const playerCards = this._cards[playerName];
          return playerCards.length > 0 && playerCards[0] !== 'Guard';
        });

      if (target) {
        this.logger.info(
          `${this.getName()} knows the hand card of ${target}`,
          `and targets ${target} with a Guard`
        );
        return target;
      }
    }

    // Prioritize other targets
    if (validTargets.length === 1) {
      validTargets = validTargets.filter(target => target !== this.getName());
    }

    if (cardToPlay.validTargetPlayers.length > 0) {
      return validTargets[
        Math.floor(Math.random() * validTargets.length)
      ];
    }

    return null;
  }

  _getPreferredChoice(cardToPlay, cardTarget) {
    if (cardTarget && cardToPlay.name !== 'Guard') return null;

    // If we know the handcard, return that (if it is not Guard)
    const targetCards = this._cards[cardTarget];
    if (
        targetCards &&
        targetCards.handCards.length > 0 &&
        targetCards.handCards[0] !== 'Guard'
      ) {
      return targetCards.handCards[0];
    }

    // Otherwise count what is left and random
    const remainingCards = this.GUARD_TARGET_CARDS.slice(0);

    let knownCards = this._gameStatus.removedCards;

    Object.values(this._cards).forEach((playerCards) => {
      knownCards = knownCards.concat(
        playerCards.handCards, playerCards.tableCards
      );
    });

    knownCards.forEach((card) => {
      const index = remainingCards.indexOf(card);
      if (index > -1) {
        remainingCards.splice(index, 1);
      }
    });

    this.logger.info(
      `${this.getName()} knows that only certains cards remain hidden`,
      remainingCards
    );

    return remainingCards[Math.floor(Math.random() * remainingCards.length)];
  }
}


module.exports = SmartBot;
