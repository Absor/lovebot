const chai = require('chai');

const Game = require('../lib/Game');

const expect = chai.expect;


describe('Playing many games', function testContext() {
  this.timeout(10000);

  it('is possible', (done) => {
    const promises = [];

    for (let i = 0; i < 1000; i += 1) {
      promises.push(new Promise((resolve) => {
        const game = new Game();
        game.joinGameAsPlayer('tester1');
        game.joinGameAsPlayer('tester2');

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

          resolve();
        });

        game.startGameAsPlayer('tester2');
      }));
    }

    Promise.all(promises).then(() => done());
  });
});
