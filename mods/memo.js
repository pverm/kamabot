var fs     = require('fs');
var c      = require('irc-colors');
var models = require('../models');

function notify(app) {
  app.memoNotify = setInterval(function() {
    models.Memo.findAll({
      attributes: ['nick', [models.sequelize.fn('COUNT', models.sequelize.col('cleared')), 'uncleared']],
      where: { cleared: false },
      group: ['nick']
    }).then(function(instances) {
      instances.forEach(function(instance) {
        var numUncleared = instance.dataValues.uncleared;
        var plural = (numUncleared === '1') ? '.' : 's.';
        var notification = 'Hey, you have ' + numUncleared + ' uncleared memo' + plural;
        app.notice(instance.nick, c.bold.yellow.bgblack(notification));
      });
    }).catch(function(err) {
      console.error(err);
    });
  }, 1000*60*60); // 1 hour
}

function act(app) {
  return function(nick, to, text, message) {

    var argsArr = text.split(' ').filter(Boolean);
    if (argsArr[0] === '.memo') parseArgs(argsArr.slice(1));

    function parseArgs(args) {
      switch (args[0]) {
        case '-s':
        case '--save':
          valSave(args); break;

        case '-r':
        case '--remove':
          valRemove(args); break;

        case '-l':
        case '--list':
        case undefined:
          valList(args); break;

        case '-c':
        case '--clear':
          valClear(args); break;

        default:
          help();
      }
    }

    function valSave(args) {
      if (args.length > 1) {
        saveMemo(args.slice(1, args.length).join(' '))
      } else {
        help();
      }
    }

    function valList(args) {
      if (args.length <= 1) {
        listMemo();
      } else {
        help();
      }
    }

    function valRemove(args) {
      if (/^(0|[1-9]([0-9]+)?)$/.test(args[1])) {
        removeMemo(args[1]);
      } else {
        help();
      }
    }

    function valClear(args) {
      if (args.length <= 1) {
        clearMemo();
      } else {
        help();
      }
    }

    function saveMemo(memo) {
      models.Memo.create({
        nick: nick,
        text: memo
      }).then(function(instance) {
        console.log('Saved memo with id ' + instance.id + ' for user ' + nick);
        app.notice(nick, 'Saved memo with id ' + instance.id + ': ' + instance.text);
      }).catch(function(err) {
        console.error(err);
      });
    }

    function listMemo() {
      models.Memo.findAll({
        where: { nick: nick, cleared: false }
      }).then(function(memos) {
        if (memos.length >= 1) {
          memos.forEach(function(memo) {
            app.say(to, '[' + memo.id + '] ' + memo.text)
          });
        } else {
          app.notice(nick, 'You currently don\'t have any memos saved');
        }
      }).catch(function(err) {
        console.error(err);
      });
    }

    function removeMemo(id) {
      models.Memo.update({ cleared: true }, {
        where: { id: id, nick: nick, cleared: false },
        returning: true
      }).then(function(affected) {
        if (affected[0] > 0) {
          console.log('Deleted memo with ID ' + id + ': ' + affected[1][0].text);
          app.notice(nick, 'Deleted memo with ID ' + id + ': ' + affected[1][0].text);
        } else {
          app.notice(nick, 'No memo with ID ' + id + ' stored under your nick.');
        }
      }).catch(function(err) {
        console.error(err);
      });
    }

    function clearMemo() {
      models.Memo.update({ cleared: true }, {
        where: { nick: nick, cleared: false },
        returning: true
      }).then(function(affected) {
        if (affected[0] > 0) {
          console.log('Cleared all memos for ' + nick);
          app.notice(nick, 'Cleared all memos stored under your nick');
        } else {
          app.notice(nick, 'No memos stored under your nick.');
        }
      }).catch(function(err) {
        console.error(err);
      });
    }

    function help() {
      app.notice(nick, '  Usage: .memo [option]');
      app.notice(nick, '    -s, --save <memo>   save memo');
      app.notice(nick, '    -l, --list          list memos');
      app.notice(nick, '    -r, --remove <id>   remove memo');
      app.notice(nick, '    -c, --clear         clear memos');
    }

  };
}

module.exports = {
  name: 'memo',
  desc: 'remember shit',
  command: 'memo',
  event: 'message',
  auto: notify,
  action: act
};

