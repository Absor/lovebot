const chai = require('chai');

const Game = require('../lib/Game');
const King = require('../lib/cards/King');
const Handmaid = require('../lib/cards/Handmaid');

const expect = chai.expect;


describe('Card King', () => {
  let game = null;
  let currentPlayer = null;
  let otherPlayer = null;

  beforeEach(() => {
    game = new Game();
    game.joinGameAsPlayer('tester1');
    game.joinGameAsPlayer('tester2');

    game.startGameAsPlayer('tester1');

    otherPlayer = game.getPlayers()[1];

    currentPlayer = game.getCurrentPlayer();
    const handCards = currentPlayer.getHandCards();
    handCards.pop();
    handCards.pop();
    handCards.push(new King());
    handCards.push(new Handmaid());
  });

  it('can be played targeting other player', (done) => {
    game.on('event', (event) => {
      if (event.type !== 'cardPlay') return;

      expect(event).to.deep.equal({
        for: event.for,
        type: 'cardPlay',
        player: currentPlayer.getName(),
        card: 'King',
        target: otherPlayer.getName(),
        cardChoice: null,
      });

      done();
    });

    game.playCardAsPlayer(
      currentPlayer.getName(), 'King', otherPlayer.getName()
    );
  });

  it('can\'t be played targeting self', (done) => {
    game.on('error', (event) => {
      if (event.type !== 'invalidCardTarget') return;

      expect(event).to.deep.equal({
        for: event.for,
        type: 'invalidCardTarget',
        card: 'King',
        target: currentPlayer.getName(),
      });

      done();
    });

    game.playCardAsPlayer(
      currentPlayer.getName(), 'King', currentPlayer.getName()
    );
  });

  it('can\'t be played targeting protected player', (done) => {
    game.on('error', (event) => {
      if (event.type !== 'invalidCardTarget') return;
      expect(event).to.deep.equal({
        for: event.for,
        type: 'invalidCardTarget',
        card: 'King',
        target: otherPlayer.getName(),
      });

      done();
    });

    otherPlayer.setProtected(true);

    game.playCardAsPlayer(
      currentPlayer.getName(), 'King', otherPlayer.getName()
    );
  });
});
