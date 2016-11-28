const { shuffleArray } = require('./utils');
const Guard = require('./cards/Guard');
const Priest = require('./cards/Priest');
const Baron = require('./cards/Baron');
const Handmaid = require('./cards/Handmaid');
const Prince = require('./cards/Prince');
const King = require('./cards/King');
const Countess = require('./cards/Countess');
const Princess = require('./cards/Princess');


class Deck {

  constructor() {
    this._cards = [];
    this._allCards = [];
    this._removedCard = null;

    this._addAllCards();
  }

  getAllCards() {
    return this._allCards;
  }

  shuffle() {
    shuffleArray(this._cards);
  }

  drawCard() {
    if (this._cards.length === 0) {
      return this.drawRemovedCard();
    }
    return this._cards.pop();
  }

  getCardCount() {
    return this._cards.length;
  }

  removeCard() {
    this._removedCard = this.drawCard();
  }

  drawRemovedCard() {
    const card = this._removedCard;
    this._removedCard = null;
    return card;
  }

  _addAllCards() {
    // 1 - Guard (5)
    this._cards.push(new Guard());
    this._cards.push(new Guard());
    this._cards.push(new Guard());
    this._cards.push(new Guard());
    this._cards.push(new Guard());
    // 2 - Priest (2)
    this._cards.push(new Priest());
    this._cards.push(new Priest());
    // 3 - Baron (2)
    this._cards.push(new Baron());
    this._cards.push(new Baron());
    // 4 - Handmaid (2)
    this._cards.push(new Handmaid());
    this._cards.push(new Handmaid());
    // 5 - Prince (2)
    this._cards.push(new Prince());
    this._cards.push(new Prince());
    // 6 - King (1)
    this._cards.push(new King());
    // 7 - Countess (1)
    this._cards.push(new Countess());
    // 8 - Princess (1)
    this._cards.push(new Princess());

    this._allCards = this._cards.slice(0);
  }

}


module.exports = Deck;
