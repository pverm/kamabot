var request = require('request');

function act(app) {
  return function(nick, to, text, message) {
    var match = text.match(/([0-9]+) *(yen|¥|円|en)\b/i);
    if (match) text = '.currency jpy eur ' + match[1];

    var keywords = text.split(/[ ]+/g);
    if (keywords[0] === '.currency') {
      if (keywords.length < 3) return help();
      var baseRate = keywords[1].toUpperCase();
      var reqRate  = keywords[2].toUpperCase();
      var val      = Number(keywords[3]);
      var url      = 'http://api.fixer.io/latest?base=' + baseRate + '&symbols=' + reqRate; 
      if (!val) return help();

      request.get(url, function(error, response, body) {
        if (error) return console.error(error);
        var obj = JSON.parse(body);
        if (obj.error) {
          app.say(to, obj.error);
        } else if (!obj.rates.hasOwnProperty(reqRate)) {
          app.say(to, 'Invalid target currency');
        } else {
          var exchangeRate = obj.rates[reqRate];
          var converted = (val * exchangeRate).toFixed(2);
          app.say(to, val + ' ' + baseRate + ' = ' + converted + ' ' + reqRate);
        }
      });
    }

  function help() {
    app.say(to, 'Usage: .currency <base currency> <target currency> <amount>  |  .currency jpy eu 2000');
  }

  };
}

module.exports = {
  name: 'currency',
  desc: 'convert currency',
  command: 'currency',
  event: 'message',
  action: act
};
