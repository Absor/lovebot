const Handmaid = require('./cards/Handmaid');


class Player {

  constructor(game, name) {
    this._game = game;
    this._name = name;

    this._handCards = [];
    this._tableCards = [];
    this._tokensOfAffection = 0;
    this._isCurrentPlayer = false;
    this._isOutOfRound = false;
    this._isProtected = false;
  }

  getName() {
    return this._name;
  }

  giveCard(card) {
    this._handCards.push(card);
  }

  tableCard(card) {
    const index = this._handCards.indexOf(card);
    this._handCards.splice(index, 1);
    this._tableCards.push(card);
  }

  removeHandCard(card) {
    const index = this._handCards.indexOf(card);
    this._handCards.splice(index, 1);
  }

  getHandCards() {
    return this._handCards;
  }

  getTableCards() {
    return this._tableCards;
  }

  getTokensOfAffectionCount() {
    return this._tokensOfAffection;
  }

  isCurrentPlayer() {
    return this._isCurrentPlayer;
  }

  setCurrentPlayer(status) {
    this._isCurrentPlayer = status;
  }

  isOutOfRound() {
    return this._isOutOfRound;
  }

  setOutOfRound(status) {
    this._isOutOfRound = status;
  }

  removeAllCards() {
    this._handCards = [];
    this._tableCards = [];
  }

  removeFromRound() {
    this._isOutOfRound = true;
    this._handCards.forEach((card) => {
      this._tableCards.push(card);
    });
    this._handCards = [];
  }

  giveTokenOfAffection() {
    this._tokensOfAffection += 1;
  }

  canPlayCard(card) {
    if (this._handCards.length !== 2) return false;
    if (!this._isCardInHand(card)) return false;

    const otherCard = this._handCards.find(c => c !== card);

    return card.canPlayWith(otherCard);
  }

  getValidCardTargets(card) {
    if (!this.canPlayCard(card)) return [];

    return card.getValidTargets(this._game.getPlayers());
  }

  getTopTableCard() {
    if (this._tableCards.length === 0) return null;
    return this._tableCards[this._tableCards.length - 1];
  }

  setProtected(status) {
    this._isProtected = status;
  }

  isProtected() {
    return this._isProtected;
  }

  getHandCardByName(cardName) {
    if (typeof cardName !== 'string') return null;
    return this._handCards.find(c => (
      c.getName().toLowerCase() === cardName.toLowerCase()
    ));
  }

  _isCardInHand(card) {
    return this._handCards.indexOf(card) !== -1;
  }
}


module.exports = Player;
