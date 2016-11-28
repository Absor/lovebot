const chai = require('chai');

const Game = require('../lib/Game');

const expect = chai.expect;


describe('Joining game', () => {
  let game = null;

  beforeEach(() => {
    game = new Game();
  });

  it('creates a join event', (done) => {
    game.on('event', (event) => {
      expect(event).to.deep.equal({
        for: [
          'tester1',
        ],
        type: 'playerJoin',
        player: 'tester1',
      });
      done();
    });

    game.joinGameAsPlayer('tester1');
  });

  it('adds player to game players', () => {
    expect(game.getPlayers()).to.have.length(0);

    game.joinGameAsPlayer('tester1');

    expect(game.getPlayers()).to.have.length(1);
  });

  it('throws an error if more than four try to join', () => {
    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');
    game.joinGameAsPlayer('tester3');
    game.joinGameAsPlayer('tester4');

    expect(game.joinGameAsPlayer.bind(game, 'tester5')).to.throw(
      Error, 'Player tester5 tried to join the game but the game is full.'
    );
  });

  it('fills the game after 4 players have joined', () => {
    expect(game.isFull()).to.be.false;

    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');
    game.joinGameAsPlayer('tester3');
    game.joinGameAsPlayer('tester4');

    expect(game.isFull()).to.be.true;

    try {
      game.joinGameAsPlayer('tester5');
    } catch (e) {
      // OK.
    }

    expect(game.getPlayers()).to.have.length(4);
  });

  it('throws an error after starting the game', () => {
    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');

    game.startGameAsPlayer('tester2');

    expect(game.joinGameAsPlayer.bind(game, 'tester3')).to.throw(
      Error, 'Player tester3 tried to join the game but the game has started.'
    );
  });

  it('does not add players to the game after starting the game', () => {
    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');

    game.startGameAsPlayer('tester2');

    try {
      game.joinGameAsPlayer('tester3');
    } catch (e) {
      // OK.
    }

    expect(game.getPlayers()).to.have.length(2);
  });

  it('has to be done with a unique name', () => {
    game.joinGameAsPlayer('tester1');
    expect(game.joinGameAsPlayer.bind(game, 'tester1')).to.throw(
      Error, 'Player tester1 is already in the game.'
    );
  });
});
