var fs         = require('fs');
var models     = require('../models');
var dateFormat = require('dateformat');

function act(app) {
  return function(nick, to, text, message) {

    var keywords = text.split(' ');

    if (keywords[0].toLowerCase() === '.quote') {
      parseKeywoards(keywords);
    }

    function parseKeywoards(kw) {
      if (kw.length < 2) {
        help();
      } else if (kw.length === 2) {
        var user = kw[1];
        postQuote(user);
      } else {
        var user = kw[1];
        var quote = kw.splice(2).join(' ').trim();
        if (quote)
          saveQuote(user, quote);
      }
    }

    /**
     * post quote to channel
     */
    function postQuote(user) {
      models.Quote.findOne({
        where: { nick: user },
        order: [[models.Sequelize.fn('RANDOM'),]]
      }).then(function(instance) {
        if (instance) {
          return models.Quote.update({
            lastPostedAt: new Date()
          }, {
            where: { id: instance.id },
            returning: true
          });
        }
      }).then(function(affected) {
        if (affected) {
          var predb = new Date(2015,10,4,15);
          if (affected[1][0].createdAt > predb) {
            var datestr = dateFormat(affected[1][0].createdAt, '(dd.mm.yyyy HH:MM)');
          } else {
            var datestr = '';
          }
          app.say(to, affected[1][0].nick + ': \'' + affected[1][0].quote + '\' ' + datestr);
        } else {
          app.say(to, 'No quotes from ' + user + ' saved.');
        }
      }).catch(function(err) {
        console.error(err);
      });
    }

    /**
     * save quote in database
     */
    function saveQuote(user, quote) {
      models.Quote.findOne({
        where: {
          nick: user,
          quote: quote,
        }
      }).then(function(instance) {
        if (!instance) {
          return models.Quote.create({
            nick: user,
            quote: quote,
            savedBy: nick,
            lastPostedAt: new Date()
          });
        }
      }).then(function(instance) {
        if (instance) {
          console.log('Saved quote with id ' + instance.id);
          app.notice(nick, 'Saved quote by ' + instance.nick + ': ' + instance.quote);
        } else {
          app.notice(nick, 'Quote already saved.');
        }
      }).catch(function(err) {
        console.error(err);
      });
    }

    /**
     * post help message
     */
    function help() {
      app.say(to, 'Syntax: .quote <name> [<quote>]');
    }

  };
}

module.exports = {
  name: 'quote',
  desc: 'save and post quotes',
  command: 'quote',
  event: 'message',
  action: act
};

