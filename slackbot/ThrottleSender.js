const fetch = require('node-fetch');
const FormData = require('form-data');


const MESSAGE_THROTTLE_MS = 1100;
const MESSAGE_CHECK_INTERVAL_MS = 50;


class ThrottleSender {

  constructor(logger, ws, token) {
    this.logger = logger;
    this._ws = ws;
    this._token = token;

    this._channelQueues = {};
    this._lastChannelSend = {};

    this._messageId = 0;

    this._interval = setInterval(
      this._handleMessages.bind(this),
      MESSAGE_CHECK_INTERVAL_MS
    );
  }

  sendMessage(imChannel, text, attachments) {
    const channelId = imChannel.id;

    if (!this._channelQueues[channelId]) {
      this._channelQueues[channelId] = [];
    }

    this._channelQueues[channelId].push({
      text,
      attachments,
    });
  }

  _handleMessages() {
    const now = Date.now();
    Object.keys(this._channelQueues).forEach((key) => {
      const queue = this._channelQueues[key];

      if (!queue || queue.length === 0) return;

      const lastSend = this._lastChannelSend[key];

      // Always send now if we don't have the last send time
      let timeSinceLast = MESSAGE_THROTTLE_MS;

      if (lastSend) {
        timeSinceLast = now - lastSend;
      }
      if (timeSinceLast < MESSAGE_THROTTLE_MS) return;

      const item = queue.shift();

      this._lastChannelSend[key] = now;
      this._sendMessage(key, item).then(() => {});
    });
  }

  async _sendMessage(channelId, item) {
    if (item.attachments) {
      const form = new FormData();
      form.append('channel', channelId);
      form.append('attachments', JSON.stringify(item.attachments));
      form.append('as_user', 'true');

      if (item.text) {
        form.append('text', item.text);
      }

      this.logger.info('Sending message using HTTPS API', {
        channel: channelId,
        attachments: item.attachments
      });

      const response = await fetch(
        `https://slack.com/api/chat.postMessage?token=${this._token}`,
        {
          method: 'POST',
          body: form,
          headers: form.getHeaders(),
        }
      );

      const jsonBody = await response.json();

      if (!jsonBody.ok) {
        this.logger.error('HTTPS API request error', jsonBody);
      }
    } else {
      const message = {
        type: 'message',
        id: this._messageId,
        channel: channelId,
        text: item.text,
      };
      this._messageId += 1;

      this.logger.info('Sending message using WebSocket', message);
      this._ws.send(JSON.stringify(message));
    }
  }

}


module.exports = ThrottleSender;
