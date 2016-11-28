

class Card {

  constructor(value, name) {
    this._value = value;
    this._name = name;
  }

  getValue() {
    return this._value;
  }

  getName() {
    return this._name;
  }

  canPlayWith(otherCard) { // eslint-disable-line no-unused-vars
    throw new Error('Card canPlayWith is not implemented');
  }

  getValidTargets(players) { // eslint-disable-line no-unused-vars
    throw new Error('Card getValidTargets is not implemented');
  }

  /* When this is called we expect that everything is okay:
   * - card can be played
   * - target player is in valid targets
   * - cardChoice is "valid".
   */
  play(events, targetPlayer, cardChoice) { // eslint-disable-line no-unused-vars
    throw new Error('Card play is not implemented');
  }
}


module.exports = Card;
