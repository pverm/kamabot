function act(bot) {
  return function(channel, nick, message) {
    if (!(nick===bot.nick)) {
      var phrases = [
        'Hey ' + nick + '! :-)',
        'What\'s up?',
        'Hi ' + nick + ', good to see you!',
        'Hello ' + nick + '! :D',
        'Yo ' + nick + ', how u doin?',
      ];
      bot.say(channel, phrases[Math.floor(Math.random() * phrases.length)]);
    }
  };
}

module.exports = {
  name: 'welcome',
  desc: 'welcomes users when they join channel',
  event: 'join',
  action: act
};
