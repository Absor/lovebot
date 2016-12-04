const chai = require('chai');

const Game = require('../lib/Game');

const expect = chai.expect;


describe('Replaying game', () => {
  let game = null;
  let otherGame = null;

  beforeEach(() => {
    game = new Game();
    otherGame = new Game();
  });

  it('is possible', (done) => {
    const gameEvents = [];
    const otherGameEvents = [];

    otherGame.on('event', (event) => {
      otherGameEvents.push(event);
    });

    game.on('event', (event) => {
      gameEvents.push(event);
    });

    // "Bot" play
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

    // The other game should end the same way
    otherGame.on('event', (event) => {
      if (event.type !== 'gameEnd') return;

      expect(gameEvents).to.deep.equal(otherGameEvents);

      done();
    });

    game.on('input', (event) => {
      // Replay to the other game
      otherGame.emit('input', event);
    });

    // Start!
    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');
    game.startGameAsPlayer('tester1');
  });
});
