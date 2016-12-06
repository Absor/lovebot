const winston = require('winston');

const SlackBot = require('./SlackBot');
const LoveBot = require('./LoveBot');
const Database = require('./Database');


const SLACK_TOKEN = process.env.SLACK_TOKEN;
const DB_LOCATION = process.env.DB_LOCATION || ':memory:';


const logger = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      json: true,
      stringify: true,
    }),
  ],
});

const slackBot = new SlackBot(logger, SLACK_TOKEN);

const db = new Database(logger, DB_LOCATION);

const bot = new LoveBot(logger, slackBot, db);
bot.start();
