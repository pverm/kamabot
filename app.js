"use strict";

const fs         = require('fs');
const path       = require('path');
const irc        = require('irc');
const yaml       = require('js-yaml');
const dateFormat = require('dateformat');
const config     = yaml.safeLoad(fs.readFileSync('./config/config.yaml', 'utf8'));
const models     = require('./models');

const kamaBot = new irc.Client(config.server, config.botName, config.options);
kamaBot.express = config.express;
kamaBot.modconf = config.mods;
kamaBot.loadedMods = {};
kamaBot.cd = {};
kamaBot.db = {};

// catch irc network errors
kamaBot.on('error', function(message) {
  console.error('error: ', message);
});

// identify to server
kamaBot.on('registered', function(message) {
  if (config.identification === 'NickServ') {
    kamaBot.say('NickServ', 'IDENTIFY ' + config.password);
  }
});

// increase message event max listeners
kamaBot._maxListeners = 20;

// log messages/join/quit stuff to console
kamaBot.on('message', function(nick, to, text, message) {
  console.log(to + ': ' +  nick + ' => ' + text);
});
kamaBot.on('join', function(channel, nick, message) {
  console.log(channel + ': ' +  nick + ' joined.');
});
kamaBot.on('part', function(channel, nick, reason, message) {
  console.log(channel + ': ' +  nick + ' parted. (' + reason + ')');
});

/**
 * save irc message in database
 */
function saveMessage(message) {
  const now         = new Date();
  const serverName  = config.server;
  const channelName = message.args[0] || [];
  let command       = message.command;

  // dont log private messages to bot
  if (channelName[0] !== '#') return;

  // add kick reason to text
  let text = (command === 'KICK') ? message.args[1] + '(' + message.args[2] + ')' : message.args[1];

  // check if PRIVMSG is emote action
  if (command === 'PRIVMSG' && text.startsWith('\u0001ACTION')) {
    command = 'EMOTE';
    text = text.slice(8,-1);
  }

  if (['PRIVMSG', 'TOPIC', 'JOIN', 'KICK', 'PART', 'EMOTE', 'QUIT'].indexOf(command) >= 0) {
    getChannel(channelName, serverName).then(function(channel) {
      return models.Message.create({
        prefix: message.prefix,
        nick: message.nick,
        host: message.host,
        command: command,
        postedAt: now,
        postedAtDate: dateFormat('yyyy-mm-dd'),
        text: text,
        channel_id: channel.id
      });
    }).catch(function(err) {
      console.error(err);
    });
  }
}

/**
 * get server from database (create new if it doesnt exist yet)
 */
function getServer(servername) {
  return models.Server.findOrCreate({
    where: { name: servername }
  }).spread(function(instance, created) {
    return instance;
  }).catch(function(err) {
    console.error(err);
  });
}

/**
 * get channel from database (create new if it doesnt exist yet)
 */
function getChannel(channelname, servername) {
  return getServer(servername).then(function(server) {
    return models.Channel.findOrCreate({
      where: {
        name: channelname,
        server_id: server.id
      }
    }).spread(function(instance, created) {
      return instance;
    }).catch(function(err) {
      console.error(err);
    });
  });
}

kamaBot.on('raw', saveMessage);

kamaBot.on('selfMessage', function(to, text) {
  setTimeout(function() {
    saveMessage({
      nick: kamaBot.nick,
      prefix: null,
      host: null,
      command: 'PRIVMSG',
      args: [to, text]
    });
  }, 500);
});

let oldChans = {};
let keepOldChans = setInterval(function() {
    oldChans = JSON.parse(JSON.stringify(kamaBot.chans));
}, 5000);

kamaBot.on('quit', function(nick, reason, channels, message) {
  for (let channel of channels) {
    if (nick in oldChans[channel].users) {
      saveMessage({
        nick: nick,
        prefix: message.prefix,
        host: message.host,
        command: 'QUIT',
        args: [channel, reason]
      })
      console.log(channel + ': ' +  nick + ' quit. (' + reason + ')');
    }
  }
});

/**
 * attach server to bot
 */
getServer(config.server).then(function(server) {
  kamaBot.db.server = server;
}).catch(function(err) {
  console.log('Failed to attach server.');
});

/**
 * load up all mods in mods folder
 */
function loadAllMods() {
  fs.readdir('./mods', function(err, files) {
    if (err) console.error(err);
    files.forEach( function(file) {
      if (path.extname(file).toLowerCase() === '.js') {
        if (!(path.basename(file, '.js') in kamaBot.loadedMods)) {
          let mod = require('./mods/' + file);
          if (mod.cooldown) kamaBot.cd[mod.name] = false;
          if (mod.auto) mod.auto(kamaBot)
          if (mod.event) kamaBot.on(mod.event, mod.action(kamaBot));
          kamaBot.loadedMods[path.basename(file, '.js')] = mod;
        } else {
          console.error('Module ' + path.basename(file, '.js') + ' already loaded.');
        }
      }
    });
  });
}

loadAllMods();

