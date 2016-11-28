class EventTransformer {

  transform(event) {
    const handler = this[event.type];

    if (!handler) throw Error(`No handler for ${event.type}.`);

    return handler(event);
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

  ['playerJoin'](event) {
    let playerText = 'There are no other players in the game.';

    if (event.for.length > 1) {
      const boldPlayers = event.for.map(player => `*${player}*`);

      if (boldPlayers.length === 2) {
        playerText = `${boldPlayers.join(' and ')}`;
      } else {
        const last = boldPlayers.pop();

        playerText = `${boldPlayers.join(', ')} and ${last}`;
      }

      playerText += ' are in the game.';
    }

    return [
      {
        for: event.for.filter(name => name !== event.player),
        text: `*${event.player}* joined the game. ${playerText}`,
      },
      {
        for: [event.player],
        text: `*You* joined the game. ${playerText}`,
      },
    ];
  }

  ['gameStart'](event) {
    return [
      {
        for: event.for.filter(name => name !== event.starter),
        text: `*${event.starter}* started the game.`,
      },
      {
        for: [event.starter],
        text: '*You* started the game.',
      },
    ];
  }

  ['cardPlay'](event) {
    let text = `*${event.player}* plays *${event.card}*`;

    if (event.target) {
      const part = ` targeting *${event.target}*`;
      text += part;
    }

    if (event.cardChoice) {
      const part = ` and choosing *${event.cardChoice}*`;
      text += part;
    }

    text += '.';

    return [
      {
        for: event.for,
        text,
      },
    ];
  }

  ['roundEnd'](event) {
    const textParts = [
      `Round *${event.round}* ends.`,
      `Winner of the round is *${event.winner}*.`,
    ];

    event.playersLeft.forEach((player) => {
      const text = [
        `*${player.name}* had *${player.handCard}* and`,
        `discarded cards with a total value of *${player.tableValue}*.`,
      ].join(' ');
      textParts.push(text);
    });

    return [
      {
        for: event.for,
        text: textParts.join('\n'),
      },
    ];
  }

  ['gameEnd'](event) {
    return [
      {
        for: event.for.filter(name => name !== event.winner),
        text: `The game ends. *${event.winner}* wins the game.`,
      },
      {
        for: [event.winner],
        text: 'The game ends. *You* win the game.',
      },
    ];
  }

  ['roundStart'](event) {
    return [
      {
        for: event.for,
        text: `Round *${event.round}* starts.`,
      },
    ];
  }

  ['privateStatus'](event) {
    if (event.isOutOfRound) {
      return [
        {
          for: event.for,
          text: '*You* are out of the round.',
        },
      ];
    }

    const textParts = [
      '*You* have in your hand:',
    ];

    event.cardsInHand.forEach((card) => {
      let text = `*${card.name}*`;

      if (card.canPlay) {
        text += ' that you *can play* with';

        if (card.validTargetPlayers.length > 0) {
          text += ' valid target';

          const validBoldTargets = card.validTargetPlayers.map(
            target => `*${target}*`
          );

          if (validBoldTargets.length === 1) {
            text += ` ${validBoldTargets[0]}`;
          } else if (card.validTargetPlayers.length === 2) {
            text += `s ${validBoldTargets.join(' and ')}`;
          } else {
            const last = validBoldTargets.pop();
            text += `s ${validBoldTargets.join(', ')}`;
            text += ` and ${last}`;
          }
          text += '.';
        } else {
          text += ' no valid targets.';
        }
      } else {
        text += ' that you *can not play*';

        if (!event.isCurrentPlayer) {
          text += ' because it is not your turn';
        }

        text += '.';
      }

      textParts.push(text);
    });

    // TODO card targets

    return [
      {
        for: event.for,
        text: textParts.join('\n'),
      },
    ];
  }

  ['gameStatus'](event) {
    const attachments = [];

    const verb = event.deckCardCount === 1 ? 'is' : 'are';
    const noun = event.deckCardCount === 1 ? 'card' : 'cards';

    attachments.push({
      text: [
        `It is round *${event.round}.*`,
        `There ${verb} *${event.deckCardCount}* ${noun} in the deck.`,
      ].join(' '),
      mrkdwn_in: ['text'],
      color: '#000000', // black
    });

    const playerList = event.players.map(player => `*${player.name}*`);

    attachments.push({
      text: [
        'Play order with the current player first:',
        `${playerList.join(', ')}`,
      ].join(' '),
      mrkdwn_in: ['text'],
      color: '#87CEFA', // lightskyblue
    });

    const tokensOfAffection = {
      title: 'Tokens of affection',
      fields: [],
      color: '#FF69B4', // hotpink
    };

    event.players.forEach((player) => {
      tokensOfAffection.fields.push({
        title: player.name,
        value: player.tokenOfAffectionCount,
        short: true,
      });
    });

    tokensOfAffection.fields.push({
      title: 'on the table',
      value: event.tokenOfAffectionCount,
      short: true,
    });

    attachments.push(tokensOfAffection);

    const cardsOnTheTable = {
      title: 'Cards on the table',
      fields: [],
      color: '#FFD700', // gold
    };

    event.players.forEach((player) => {
      let cards = player.tableCards.slice(0);
      cards.reverse();
      cards = cards.join('\n');

      if (!cards) {
        cards = '-';
      }

      cardsOnTheTable.fields.push({
        title: player.name,
        value: cards,
        short: true,
      });
    });

    let cardsRemoved = event.removedCards.slice(0);
    cardsRemoved.reverse();
    cardsRemoved = cardsRemoved.join('\n');

    if (cardsRemoved) {
      cardsOnTheTable.fields.push({
        title: 'removed from the deck',
        value: cardsRemoved,
        short: true,
      });
    }

    attachments.push(cardsOnTheTable);

    event.players.forEach((player) => {
      if (player.isProtected) {
        attachments.push({
          text: `*${player.name}* is protected.`,
          mrkdwn_in: ['text'],
          color: '#1E90FF', // dodgerblue
        });
      } else if (player.isOutOfRound) {
        attachments.push({
          text: `*${player.name}* is out of the round.`,
          mrkdwn_in: ['text'],
          color: '#DC143C', // crimson
        });
      }
    });

    attachments.push({
      text: `*${event.currentPlayer}* is the current player.`,
      mrkdwn_in: ['text'],
      color: '#32CD32', // limegreen
    });

    return [
      {
        for: event.for,
        text: '*Game status*',
        attachments,
      },
    ];
  }

  ['cardNoEffect'](event) {
    return [
      {
        for: event.for,
        text: `*${event.card}* has no effect.`,
      },
    ];
  }

  ['outOfRound'](event) {
    return [
      {
        for: event.for.filter(name => name !== event.player),
        text: [
          `*${event.player}* is out of the round`,
          `revealing *${event.handCard}*.`,
        ].join(' '),
      },
      {
        for: [event.player],
        text: `*You* are out of the round revealing *${event.handCard}*.`,
      },
    ];
  }

  ['cardReveal'](event) {
    return [
      {
        for: event.for,
        text: `*${event.player}* shows you *${event.card}*.`,
      },
    ];
  }

  ['cardShow'](event) {
    return [
      {
        for: event.for.filter(name => name !== event.player),
        text: `*${event.player}* shows a card to *${event.target}*.`,
      },
      {
        for: [event.player],
        text: `*You* show your card to *${event.target}*.`,
      },
    ];
  }

  ['protectionStart'](event) {
    return [
      {
        for: event.for.filter(name => name !== event.player),
        text: `*${event.player}* is protected.`,
      },
      {
        for: [event.player],
        text: '*You* are protected.',
      },
    ];
  }

  ['protectionEnd'](event) {
    return [
      {
        for: event.for.filter(name => name !== event.player),
        text: `Protection on *${event.player}* ends.`,
      },
      {
        for: [event.player],
        text: 'Protection on *you* ends.',
      },
    ];
  }

  ['cardTrade'](event) {
    return [
      {
        for: event.for,
        text: `*${event.player1}* and *${event.player2}* trade cards.`,
      },
    ];
  }

  ['cardCompare'](event) {
    return [
      {
        for: event.for,
        text: `*${event.player1}* and *${event.player2}* compare cards.`,
      },
    ];
  }

  ['cardDraw'](event) {
    return [
      {
        for: event.for.filter(name => name !== event.player),
        text: `*${event.player}* draws a card.`,
      },
      {
        for: [event.player],
        text: '*You* draw a card.',
      },
    ];
  }

  ['cardReceive'](event) {
    return [
      {
        for: event.for,
        text: `*You* receive *${event.card}* from *${event.player}*.`,
      },
    ];
  }

  ['cardDiscard'](event) {
    return [
      {
        for: event.for.filter(name => name !== event.player),
        text: `*${event.player}* discards *${event.card}*.`,
      },
      {
        for: [event.player],
        text: `*You* discard *${event.card}*.`,
      },
    ];
  }
}


module.exports = EventTransformer;
