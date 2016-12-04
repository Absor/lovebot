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
      this.emit('message', message);
    });

    this._ws.on('close', () => {
      this.logger.error('Slack WebSocket connection closed, exiting.');
      process.exit(1);
    });
  }

  sendMessage(imChannel, text, attachments) {
    this._sender.sendMessage(imChannel, text, attachments);
  }
}


module.exports = SlackBot;
