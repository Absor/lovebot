module.exports = {
  dynamic: {
    alreadyInGameJoin(gameStarted) {
      let messageParts = [
        'You are already in the game',
      ];
      if (!gameStarted) {
        messageParts.push('. Write *start* to start the game.');
      } else {
        messageParts = messageParts.concat([
          ' and the game has started. Write *play <cardname> ',
          '<target player name> <card choice>* ',
          'to play a card when it is your turn.',
        ]);
      }
      return {
        text: messageParts.join(''),
      };
    },

    stats(winners) {
      const winCount = winners.reduce((result, winner) => {
        let key = winner;

        if (winner.startsWith('bot_')) {
          key = 'Bots';
        }

        if (result[key] === undefined) {
          result[key] = 0;
        }
        result[key] += 1;
        return result;
      }, {});

      const attachments = Object.keys(winCount).map((player) => {
        return {
          text: `*${player}* - ${winCount[player]} wins`,
          mrkdwn_in: ['text']
        }
      });

      console.log(attachments);

      return {
        text: '*Statistics*',
        attachments,
      }
    }
  },

  static: {
    notInGamePlay: {
      text: 'You are not in the game. Write *join* to join the game.',
    },

    notInGameStart: {
      text: 'You are not in the game. Write *join* to join the game.',
    },

    gameFullAddBot: {
      text: 'The current game is full. Wait until a new game begins.',
    },

    alreadyStartedAddBot: {
      text: [
        'The current game has already started.',
        'Wait until a new game begins.',
      ].join(' '),
    },

    notInGameAddBot: {
      text: [
        'You have to be in the game to add a bot.',
        'Write *join* to join the game.',
      ].join(' '),
    },

    gameFullJoin: {
      text: 'The current game is full. Wait until a new game begins.',
    },

    alreadyStartedJoin: {
      text: [
        'The current game has already started.',
        'Wait until a new game begins.',
      ].join(' '),
    },

    comands: {
      text: [
        '*Commands*',
        '*cards* to show a summary of cards.',
        '*join* to join a game.',
        '*start* to start a game you have joined.',
        '*play <cardname> <target player name> <card choice>* ' +
          'to play a card when it is your turn.',
        '*addbot* to add a bot player to a game you have joined.',
      ].join('\n'),
    },

    listOfCards: {
      text: '*List of cards*',
      attachments: [
        {
          title: '8 - Princess (1)',
          text: 'If you discard this card, you are out of the round.',
          color: '#0033FF',
        },
        {
          title: '7 - Countess (1)',
          text: [
            'If you have this card and the King or Prince in your hand,',
            'you must discard this card.',
          ].join(' '),
          color: '#0066FF',
        },
        {
          title: '6 - King (1)',
          text: 'Trade hands with another player of your choice.',
          color: '#0099FF',
        },
        {
          title: '5 - Prince (2)',
          text: [
            'Choose any player including yourself to',
            'discard his or her hand and draw a new card.',
          ].join(' '),
          color: '#00CCFF',
        },
        {
          title: '4 - Handmaid (2)',
          text: [
            'Until your next turn,',
            'ignore all effects from other player\'s cards.',
          ].join(' '),
          color: '#00FFCC',
        },
        {
          title: '3 - Baron (2)',
          text: [
            'You and another player secretly compare hands.',
            'The player with the lower value is out of the round.',
          ].join(' '),
          color: '#00FF99',
        },
        {
          title: '2 - Priest (2)',
          text: 'Look at a another player\'s hand.',
          color: '#00FF66',
        },
        {
          title: '1 - Guard (5)',
          text: [
            'Name a non-Guard card and choose another player.',
            'If that player has that card, he or she is out of the round.',
          ].join(' '),
          color: '#00FF33',
        },
      ],
    },
  },
};
