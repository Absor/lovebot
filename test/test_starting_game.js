const chai = require('chai');

const Game = require('../lib/Game');

const expect = chai.expect;


describe('Starting game', () => {
  let game = null;

  beforeEach(() => {
    game = new Game();
  });

  it('is not possible without at least two players', (done) => {
    game.once('error', (event) => {
      expect(event).to.deep.equal({
        for: ['tester1'],
        type: 'notEnoughPlayers',
      });

      done();
    });

    game.joinGameAsPlayer('tester1');
    game.startGameAsPlayer('tester1');
  });

  it('creates a start event', (done) => {
    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');

    game.on('event', (event) => {
      if (event.type !== 'gameStart') return;

      expect(event).to.deep.equal({
        for: event.for,
        type: 'gameStart',
        starter: 'tester1',
      });

      done();
    });

    game.startGameAsPlayer('tester1');
  });

  it('is not possible if game has already started', (done) => {
    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');

    game.startGameAsPlayer('tester1');

    game.on('error', (event) => {
      expect(event).to.deep.equal({
        for: event.for,
        type: 'alreadyStarted',
      });

      done();
    });

    game.startGameAsPlayer('tester1');
  });

  it('starts the game', () => {
    expect(game.hasStarted()).to.be.false;

    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');

    game.startGameAsPlayer('tester1');

    expect(game.hasStarted()).to.be.true;
  });
});
