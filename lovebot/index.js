const LoveBot = require('./LoveBot');


const bot = new LoveBot(process.env.SLACK_TOKEN);
bot.start();
