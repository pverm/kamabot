var fs     = require('fs');
var yaml   = require('js-yaml');
var config = yaml.safeLoad(fs.readFileSync(__dirname + '/../config/config.yaml', 'utf8'));

function act(bot) {
  return function(nick, to, text, message) {
    var COMMANDS = config.mods.botinfo.commands;
    var command = text.split(' ')[0].toLowerCase();
    if (command in COMMANDS) {
      bot.say(to, COMMANDS[command]);
    } else if (command === '.help' || command === '.commands') {
      for (var mod in bot.loadedMods) {
        if (bot.loadedMods[mod].command) {
          bot.notice(to, '.' + bot.loadedMods[mod].command + ' - ' + bot.loadedMods[mod].desc);
        }
      }
    }
  };
}

module.exports = {
  name: 'botinfo',
  desc: 'posts info about bot',
  event: 'message',
  action: act
};
