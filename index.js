const LoveBot = require('./slackbot/LoveBot');


const bot = new LoveBot(process.env.SLACK_TOKEN);
bot.start();
