const EventEmitter = require('events');
const fetch = require('node-fetch');
const WebSocket = require('ws');

const ThrottleSender = require('./ThrottleSender');


class SlackBot extends EventEmitter {

  constructor(logger, token) {
    super();

    this.logger = logger;
    this._token = token;

    this._ims = null;
    this._users = null;
    this._self = null;

    this._ws = null;
    this._sender = null;
  }

  async connect() {
    const response = await fetch(
      `https://slack.com/api/rtm.start?token=${this._token}`
    );

    const slackData = await response.json();

    if (!slackData.ok) {
      this.logger.info('Failed Slack connection initilization.', slackData);
      process.exit(1);
    }

    this._ims = slackData.ims;
    this._users = slackData.users;
    this._self = slackData.self;

    const url = slackData.url;
    this._ws = new WebSocket(url);

    this._sender = new ThrottleSender(this.logger, this._ws, this._token);

    this._ws.on('open', () => {
      this.logger.info('Slack WebSocket connection opened.');
    });

    this._ws.on('message', (data) => {
      const message = JSON.parse(data);
      this._onMessage(message);
    });

    this._ws.on('close', () => {
      this.logger.error('Slack WebSocket connection closed, exiting.');
      process.exit(1);
    });
  }

  sendMessage(username, text, attachments) {
    const user = this._users.find(u => u.name === username);
    if (!user) {
      this.logger.error(
        `Tried to send a message to non-existing user ${username}.`
      );
      return;
    }

    const imChannel = this._ims.find(im => im.user === user.id);

    if (!imChannel) {
      this.logger.error(
        'Tried to send a message to an unknown IM channel.', { username }
      );
      return;
    }

    this._sender.sendMessage(imChannel, text, attachments);
  }

  _onMessage(message) {
    if (message.type === 'team_join') {
      this._users.push(message.user);
      this.logger.info('New team member joined');
    }

    if (message.type === 'im_created') {
      this._ims.push(message.channel);
      this.logger.info('New direct message channel created');
    }

    if (message.type !== 'message') return;
    if (!message.user) return;
    if (message.hidden) return;
    if (message.user === this._self.id) return;

    const imChannel = this._ims.find(im => im.id === message.channel);
    if (!imChannel) return;

    const user = this._users.find(u => u.id === message.user);
    const username = user.name;

    this.emit('private', { username, text: message.text });
  }

}


module.exports = SlackBot;
