const EventEmitter = require('events');

const GameEvents = require('./GameEvents');
const Player = require('./Player');
const Deck = require('./Deck');
const { shuffleArray } = require('./utils');
const Guard = require('./cards/Guard');


const INITIAL_TOKEN_COUNT = 13;


class GameError extends Error {
}


class Game extends EventEmitter {

  constructor() {
    super();
    this._events = new GameEvents(this);

    this._players = [];
    this._started = false;
    this._deck = null;
    this._removedVisibleCards = [];
    this._tokensOfAffection = INITIAL_TOKEN_COUNT;

    // Don't die without error handlers
    this.on('error', () => {});

    this.on('input', this._delegateInput.bind(this));
  }

  isFull() {
    return this._players.length >= 4;
  }

  hasEnoughPlayers() {
    return this._players.length >= 2;
  }

  hasStarted() {
    return this._started;
  }

  getCurrentPlayer() {
    return this._players[0];
  }

  getDeck() {
    return this._deck;
  }

  getPlayers() {
    return this._players;
  }

  getCurrentRound() {
    return (INITIAL_TOKEN_COUNT - this._tokensOfAffection) + 1;
  }

  hasPlayerWithName(playerName) {
    return !!this.getPlayerByName(playerName);
  }

  joinGameAsPlayer(playerName) {
    if (this.hasPlayerWithName(playerName)) {
      this._throwAlreadyInGameError(playerName);
    }

    if (this.isFull()) {
      this._throwGameFullError(playerName);
    }

    if (this.hasStarted()) {
      this._throwGameAlreadyStartedError(playerName);
    }

    this._events.createJoinInput(playerName);
  }

  startGameAsPlayer(playerName) {
    if (!this.hasPlayerWithName(playerName)) {
      this._throwNotInGameError(playerName);
    }

    this._events.createStartInput(playerName);
  }

  playCardAsPlayer(playerName, cardName, targetPlayerName, cardChoice) {
    if (!this.hasPlayerWithName(playerName)) {
      this._throwNotInGameError(playerName);
    }

    this._events.createCardPlayInput(
      playerName, cardName, targetPlayerName, cardChoice
    );
  }

  _delegateInput(event) {
    switch (event.type) {
      case 'playerJoin':
        this._joinGameAsPlayer(event.playerName);
        break;
      case 'gameStart':
        this._startGameAsPlayer(event.playerName);
        break;
      case 'cardPlay':
        this._playCardAsPlayer(
          event.playerName,
          event.cardName,
          event.targetPlayerName,
          event.cardChoice
        );
        break;
      default:
        throw Error('Bad input event');
    }
  }

  _joinGameAsPlayer(playerName) {
    const player = new Player(this, playerName);
    this._players.push(player);

    this._events.createJoinEvent(playerName);
  }

  _startGameAsPlayer(playerName) {
    if (this.hasStarted()) {
      this._events.createGameAlreadyStartedError(playerName);
      return;
    }

    if (!this.hasEnoughPlayers()) {
      this._events.createNotEnoughPlayersError(playerName);
      return;
    }

    // Randomize starting player
    shuffleArray(this._players);

    this._started = true;
    this._events.createGameStartEvent(playerName);
    this._startNewRound();
  }

  _playCardAsPlayer(
    playerNameInput, cardNameInput, targetPlayerNameInput, cardChoiceInput
  ) {
    if (!this._started) {
      this._events.createGameNotStartedError(playerNameInput);
      return;
    }

    const player = this.getPlayerByName(playerNameInput);
    const playerName = player.getName();

    if (!player.isCurrentPlayer()) {
      this._events.createNotPlayerTurnError(playerName);
      return;
    }

    let targetPlayer = null;
    let targetPlayerName = null;

    if (targetPlayerNameInput) {
      targetPlayer = this.getPlayerByName(targetPlayerNameInput);

      if (!targetPlayer) {
        this._events.createNoTargetPlayerError(
          playerName, targetPlayerNameInput
        );
        return;
      }

      targetPlayerName = targetPlayer.getName();
    }

    const card = player.getHandCardByName(cardNameInput);

    if (!card) {
      this._events.createPlayerHasNoCardError(playerName, cardNameInput);
      return;
    }

    const cardName = card.getName();

    const canPlay = player.canPlayCard(card);

    if (!canPlay) {
      this._events.createCardPlayNotAllowedError(playerName, cardName);
      return;
    }

    const validTargets = player.getValidCardTargets(card);

    if (!targetPlayer && validTargets.length > 0) {
      // If there are valid targets but no target chosen
      this._events.createTargetNeededError(playerName, cardName);
      return;
    }

    if (targetPlayer && validTargets.length === 0) {
      // If there are no valid targets but target chosen
      this._events.createInvalidCardTargetError(
        playerName, cardName, targetPlayerName
      );
      return;
    }

    const targetInValidTargets = validTargets.indexOf(targetPlayer) !== -1;

    if (validTargets.length > 0 && !targetInValidTargets) {
      // If there are valid targets but target is not one of them
      this._events.createInvalidCardTargetError(
        playerName, cardName, targetPlayerName
      );
      return;
    }

    let cardChoice = null;
    if (targetPlayerName && (card instanceof Guard)) {
      let isValidChoice = false;

      if (typeof cardChoiceInput === 'string') {
        const targetCard = this._deck.getAllCards()
          .filter(c => !(c instanceof Guard))
          .find(c => c.getName().toLowerCase() === cardChoiceInput.toLowerCase());

        if (targetCard) {
          isValidChoice = true;
          cardChoice = targetCard.getName();
        }
      }

      if (!isValidChoice) {
        this._events.createInvalidCardChoiceError(
          playerName, cardName, cardChoice
        );
        return;
      }
    }

    this._events.createPlayEvent(
      playerName,
      cardName,
      targetPlayerName,
      cardChoice
    );

    player.tableCard(card);
    card.play(this._events, player, targetPlayer, cardChoice);

    this._resolveAfterPlay();
  }

  _throwAlreadyInGameError(playerName) {
    throw new GameError(`Player ${playerName} is already in the game.`);
  }

  _throwNotInGameError(playerName) {
    throw new GameError(`Player ${playerName} is not in the game.`);
  }

  _throwGameFullError(playerName) {
    throw new GameError(
      `Player ${playerName} tried to join the game but the game is full.`
    );
  }

  _throwGameAlreadyStartedError(playerName) {
    throw new GameError(
      `Player ${playerName} tried to join the game but the game has started.`
    );
  }

  _resolveAfterPlay() {
    this._players.forEach((p) => {
      if (p.isOutOfRound()) {
        p.setProtected(false);
      }
    });

    const playersLeft = this._players.filter(p => !p.isOutOfRound());

    // Fill player hands (Prince discard)
    playersLeft.forEach((player) => {
      if (player.getHandCards().length === 0) {
        player.giveCard(this._deck.drawCard());
        this._events.createDrawCardEvent(player.getName());
      }
    });

    if (playersLeft.length === 1 || this._deck.getCardCount() === 0) {
      const sortedForWin = playersLeft
        .map(winner => ({
          player: winner,
          tableValue: winner.getTableCards().reduce((value, card) => (
            value + card.getValue()
          ), 0),
          handCard: winner.getHandCards()[0],
        }))
        .sort((a, b) => {
          if (a.handCard.getValue() === b.handCard.getValue()) {
            return b.tableValue - a.tableValue;
          }

          return b.handCard.getValue() - a.handCard.getValue();
        });

      const roundWinner = sortedForWin[0].player;

      const playersLeftTransformed = sortedForWin.map(item => ({
        name: item.player.getName(),
        tableValue: item.tableValue,
        handCard: item.handCard.getName(),
      }));

      this._events.createRoundEndEvent(
        this.getCurrentRound(),
        roundWinner.getName(),
        playersLeftTransformed
      );

      this._tokensOfAffection -= 1;
      roundWinner.giveTokenOfAffection();

      // Check if someone won
      const winner = this._players.find((player) => {
        const winTokenCount = Math.ceil(
          INITIAL_TOKEN_COUNT / this._players.length);
        return player.getTokensOfAffectionCount() === winTokenCount;
      });

      if (winner) {
        this._events.createGameEndEvent(winner.getName());
        return;
      }

      while (this._players[0].getName() !== roundWinner.getName()) {
        this._players.push(this._players.shift());
      }

      this._startNewRound();
      return;
    }

    // More than one player left, continue
    this._players.push(this._players.shift());
    this._setCurrentPlayer();

    // Skip those that are out of the round
    while (this.getCurrentPlayer().isOutOfRound()) {
      this._players.push(this._players.shift());
      this._setCurrentPlayer();
    }

    if (this.getCurrentPlayer().isProtected()) {
      this.getCurrentPlayer().setProtected(false);
      this._events.createProtectionEndEvent(this.getCurrentPlayer().getName());
    }

    this._startCurrentPlayerTurn();
  }

  _awardToken(player) {
    this._tokensOfAffection -= 1;
    player.giveTokenOfAffection();
  }

  getPlayerByName(playerName) {
    if (typeof playerName !== 'string') return null;
    return this._players.find(p => (
      p.getName().toLowerCase() === playerName.toLowerCase()
    ));
  }

  _startNewRound() {
    this._deck = new Deck();
    this._deck.shuffle();
    // Set one card to the side
    this._deck.removeCard();

    // In two player game set three cards face up on the side
    if (this._players.length === 2) {
      this._removedVisibleCards = [];
      for (let i = 0; i < 3; i += 1) {
        this._removedVisibleCards.push(this._deck.drawCard());
      }
    }

    this._players.forEach((player) => {
      player.setOutOfRound(false);
      player.setProtected(false);
      player.removeAllCards();
    });

    // Deal one card to each player
    this._players.forEach((player) => {
      player.giveCard(this._deck.drawCard());
    });

    this._events.createRoundStartEvent(this.getCurrentRound());

    this._setCurrentPlayer();
    // Send status to all and wait for input
    this._startCurrentPlayerTurn();
  }

  _setCurrentPlayer() {
    this._players.forEach((player, index) => {
      player.setCurrentPlayer(index === 0);
    });
  }

  _startCurrentPlayerTurn() {
    const currentPlayer = this.getCurrentPlayer();
    const newCard = this._deck.drawCard();
    currentPlayer.giveCard(newCard);
    this._events.createDrawCardEvent(currentPlayer.getName());

    this._createStatusEvent();
    this._players.forEach(this._createPrivateStatusEvent.bind(this));
  }

  _createPrivateStatusEvent(player) {
    const cardsInHand = player.getHandCards().map((card) => {
      const validTargetPlayers = player
        .getValidCardTargets(card)
        .map(targetPlayer => targetPlayer.getName());
      return {
        name: card.getName(),
        canPlay: player.canPlayCard(card),
        validTargetPlayers,
      };
    });

    this._events.createPrivateStatusEvent(
      player.getName(),
      cardsInHand,
      player.isCurrentPlayer(),
      player.isOutOfRound()
    );
  }

  _createStatusEvent() {
    const players = this._players.map((player) => {
      const tableCards = player.getTableCards().map(card => card.getName());
      return {
        name: player.getName(),
        tableCards,
        handCardCount: player.getHandCards().length,
        tokenOfAffectionCount: player.getTokensOfAffectionCount(),
        isProtected: player.isProtected(),
        isOutOfRound: player.isOutOfRound(),
      };
    });

    this._events.createGameStatusEvent(
      players,
      this.getCurrentRound(),
      this._deck.getCardCount(),
      this.getCurrentPlayer().getName(),
      this._tokensOfAffection,
      this._removedVisibleCards.map(card => card.getName())
    );
  }

}


module.exports = Game;
