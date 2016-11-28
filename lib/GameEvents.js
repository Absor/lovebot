class GameEvents {

  constructor(game) {
    this._game = game;
  }

  // INPUT EVENTS

  createJoinInput(playerName) {
    this._createInput({
      type: 'playerJoin',
      playerName,
    });
  }

  createStartInput(playerName) {
    this._createInput({
      type: 'gameStart',
      playerName,
    });
  }

  createCardPlayInput(playerName, cardName, targetPlayerName, cardChoice) {
    this._createInput({
      type: 'cardPlay',
      playerName,
      cardName,
      targetPlayerName,
      cardChoice,
    });
  }

  // ERRORS

  createGameAlreadyStartedError(playerName) {
    this._createError({
      for: [playerName],
      type: 'alreadyStarted',
    });
  }

  createNotEnoughPlayersError(playerName) {
    this._createError({
      for: [playerName],
      type: 'notEnoughPlayers',
    });
  }

  createGameNotStartedError(playerName) {
    this._createError({
      for: [playerName],
      type: 'gameNotStarted',
    });
  }

  createNotPlayerTurnError(playerName) {
    this._createError({
      for: [playerName],
      type: 'notPlayerTurn',
    });
  }

  createNoTargetPlayerError(playerName, targetPlayerName) {
    this._createError({
      for: [playerName],
      type: 'noTargetPlayer',
      target: targetPlayerName,
    });
  }

  createPlayerHasNoCardError(playerName, cardName) {
    this._createError({
      for: [playerName],
      type: 'noCardInHand',
      card: cardName,
    });
  }

  createCardPlayNotAllowedError(playerName, cardName) {
    this._createError({
      for: [playerName],
      type: 'cardPlayNotAllowed',
      card: cardName,
    });
  }

  createTargetNeededError(playerName, cardName) {
    this._createError({
      for: [playerName],
      type: 'needTarget',
      card: cardName,
    });
  }

  createInvalidCardTargetError(playerName, cardName, targetPlayerName) {
    this._createError({
      for: [playerName],
      type: 'invalidCardTarget',
      card: cardName,
      target: targetPlayerName,
    });
  }

  createInvalidCardChoiceError(playerName, cardName, cardChoice) {
    this._createError({
      for: [playerName],
      type: 'invalidCardChoice',
      card: cardName,
      cardChoice,
    });
  }

  // OUTPUT EVENTS

  createJoinEvent(playerName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'playerJoin',
      player: playerName,
    });
  }

  createGameStartEvent(starterPlayerName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'gameStart',
      starter: starterPlayerName,
    });
  }

  createPlayEvent(playerName, cardName, targetPlayerName, cardChoice) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'cardPlay',
      player: playerName,
      card: cardName,
      target: targetPlayerName,
      cardChoice,
    });
  }

  createRoundEndEvent(round, winnerName, playersLeft) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'roundEnd',
      round,
      winner: winnerName,
      playersLeft,
    });
  }

  createGameEndEvent(winnerPlayerName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'gameEnd',
      winner: winnerPlayerName,
    });
  }

  createRoundStartEvent(round) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'roundStart',
      round,
    });
  }

  createPrivateStatusEvent(
    playerName, cardsInHand, isCurrentPlayer, isOutOfRound
  ) {
    this._createEvent({
      for: [playerName],
      type: 'privateStatus',
      cardsInHand,
      isCurrentPlayer,
      isOutOfRound,
    });
  }

  createGameStatusEvent(
    players,
    round,
    deckCardCount,
    currentPlayer,
    tokenOfAffectionCount,
    removedCards
  ) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'gameStatus',
      players,
      round,
      deckCardCount,
      currentPlayer,
      tokenOfAffectionCount,
      removedCards,
    });
  }

  createCardNoEffectEvent(cardName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'cardNoEffect',
      card: cardName,
    });
  }

  createOutOfRoundEvent(playerName, cardName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'outOfRound',
      player: playerName,
      handCard: cardName,
    });
  }

  createPrivateCardRevealEvent(forPlayerName, revealPlayerName, cardName) {
    this._createEvent({
      for: [forPlayerName],
      type: 'cardReveal',
      player: revealPlayerName,
      card: cardName,
    });
  }

  createPrivateCardShowEvent(playerName, targetPlayerName) {
    this._createEvent({
      for: this._getAllPlayerNames().filter(p => p !== targetPlayerName),
      type: 'cardShow',
      player: playerName,
      target: targetPlayerName,
    });
  }

  createPrivateCompareCardsEvent(player1Name, player2Name) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'cardCompare',
      player1: player1Name,
      player2: player2Name,
    });
  }

  createProtectionStartEvent(playerName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'protectionStart',
      player: playerName,
    });
  }

  createProtectionEndEvent(playerName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'protectionEnd',
      player: playerName,
    });
  }

  createTradeEvent(player1Name, player2Name) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'cardTrade',
      player1: player1Name,
      player2: player2Name,
    });
  }

  createDrawCardEvent(playerName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'cardDraw',
      player: playerName,
    });
  }

  createReceiveCardEvent(toPlayerName, fromPlayerName, cardName) {
    this._createEvent({
      for: [toPlayerName],
      type: 'cardReceive',
      player: fromPlayerName,
      card: cardName,
    });
  }

  createCardDiscardEvent(playerName, cardName) {
    this._createEvent({
      for: this._getAllPlayerNames(),
      type: 'cardDiscard',
      player: playerName,
      card: cardName,
    });
  }

  // EVENT HELPERS

  _getAllPlayerNames() {
    return this._game.getPlayers().map(player => player.getName());
  }

  _createEvent(event) {
    setTimeout(this._game.emit.bind(this._game, 'event', event), 0);
  }

  _createError(event) {
    setTimeout(this._game.emit.bind(this._game, 'error', event), 0);
  }

  _createInput(event) {
    setTimeout(this._game.emit.bind(this._game, 'input', event), 0);
  }

}


module.exports = GameEvents;
