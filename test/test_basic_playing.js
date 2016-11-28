const chai = require('chai');

const Game = require('../lib/Game');

const expect = chai.expect;


describe('Playing game', function testContext() {
  this.timeout(2000);

  let game = null;

  beforeEach(() => {
    game = new Game();
    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');
  });

  describe('with two players', () => {
    it('removes three extra cards from the deck', () => {
      game.startGameAsPlayer('tester1');


      expect(game.getDeck().getCardCount()).to.equal(
        16
        - 1 // One card is always removed from the deck
        - game.getPlayers().length // One card is dealt for each player
        - 1 // And one for starting player
        - 3 // eslint-disable-line comma-dangle
      );
    });
  });

  describe('with three to four players', () => {
    beforeEach(() => {
      game.joinGameAsPlayer('tester3');
    });

    it('does not remove three extra cards from the deck', () => {
      game.startGameAsPlayer('tester1');

      expect(game.getDeck().getCardCount()).to.equal(
        16 - 1 - game.getPlayers().length - 1 // eslint-disable-line comma-dangle
      );
    });
  });

  it('gives you round start events', (done) => {
    game.on('event', (event) => {
      if (event.type !== 'roundStart') return;

      expect(event).to.deep.equal({
        for: event.for,
        type: 'roundStart',
        round: 1,
      });

      expect(event.for).to.contain('tester1');
      expect(event.for).to.contain('tester2');

      done();
    });

    game.startGameAsPlayer('tester1');
  });

  it('gives you status events', (done) => {
    game.on('event', (event) => {
      if (event.type !== 'gameStatus') return;

      const currentPlayer = game.getCurrentPlayer().getName();
      const otherPlayer = currentPlayer === 'tester1' ? 'tester2' : 'tester1';

      expect(event.removedCards).to.have.length(3);

      expect(event).to.deep.equal({
        for: event.for,
        type: 'gameStatus',
        deckCardCount: 16 - 3 - 1 - 2 - 1,
        currentPlayer,
        round: 1,
        tokenOfAffectionCount: 13,
        removedCards: event.removedCards, // Can't check this reliably
        players: [
          {
            handCardCount: 2,
            name: currentPlayer,
            tableCards: [],
            tokenOfAffectionCount: 0,
            isProtected: false,
          },
          {
            handCardCount: 1,
            name: otherPlayer,
            tableCards: [],
            tokenOfAffectionCount: 0,
            isProtected: false,
          },
        ],
      });

      done();
    });

    game.startGameAsPlayer('tester1');
  });

  it('finishes the game', (done) => {
    game.on('event', (event) => {
      if (event.type !== 'privateStatus') return;
      if (event.isCurrentPlayer === false) return;

      const cardToPlay = event.cardsInHand.find(card => card.canPlay);

      const cardName = cardToPlay.name;
      const cardTarget = cardToPlay.validTargetPlayers.length !== 0 ?
                         cardToPlay.validTargetPlayers[0] : null;

      const choice = cardName === 'Guard' ? 'Baron' : null;

      game.playCardAsPlayer(event.for[0], cardName, cardTarget, choice);
    });

    game.on('event', (event) => {
      if (event.type !== 'gameEnd') return;

      expect(event).to.deep.equal({
        for: event.for,
        type: 'gameEnd',
        winner: event.winner,
      });

      done();
    });

    game.startGameAsPlayer('tester1');
  });
});
