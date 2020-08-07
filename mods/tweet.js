var oauthSignature = require('oauth-signature');
var https          = require('https');
var models         = require('../models');

function rndString(length) {
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var str = '';
  for (var i=0; i<length; i++) {
    str += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return str;
}

function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

function saveResponse(res, nick) {
  models.Tweet.create({
    data: res,
    nick: nick
  }).then(function(instance) {
    console.log(instance);
    console.log('Saved Twitter response with ID ' + res.id_str + '.');
  }).catch(function(err) {
    console.error(err);
  });
}

function act(client) {
  return function(nick, to, text, message) {

    var kw = text.split(' ');
    if (kw[0] === '.tweet' && kw.length > 1 && kw[1] !== '') {
      // lock down tweeting
      if (nick !== 'kama') return;
      var auth = client.modconf.tweet;
      if (auth) {
        if (text.length-7 > 140) {
          client.say(to, 'Over character limit: ' + String(text.length-7));
        } else {
          tweet(text.slice(7));
        }
      } else {
        client.say(to, 'No API key, access token and secrets in config');
      }
    }

    function buildAuthHeader(httpMethod, url, param) {
      var parameters = {
        oauth_consumer_key : auth.api_key,
        oauth_token : auth.access_token,
        oauth_nonce : rndString(10),
        oauth_timestamp : String(Math.floor(Date.now() / 1000)),
        oauth_signature_method : 'HMAC-SHA1',
        oauth_version : '1.0'
      };

      for (key in param) parameters[key] = param[key];

      var sig = oauthSignature.generate(
        httpMethod,
        url,
        parameters,
        auth.api_secret,
        auth.access_token_secret
      );

      var headerString = 'OAuth '
        + 'oauth_consumer_key="' + parameters.oauth_consumer_key + '", '
        + 'oauth_nonce="' + parameters.oauth_nonce + '", '
        + 'oauth_signature="' + sig + '", '
        + 'oauth_signature_method="' + parameters.oauth_signature_method + '", '
        + 'oauth_timestamp="' + parameters.oauth_timestamp + '", '
        + 'oauth_token="' + parameters.oauth_token + '", '
        + 'oauth_version="' + parameters.oauth_version + '"';

      return headerString;
    }

    function tweet(msg) {
      var httpMethod = 'POST';
      var url = 'https://api.twitter.com/1.1/statuses/update.json';
      var param = { possibly_sensitive : 'true', status : msg };
      var authHeader = buildAuthHeader(httpMethod, url, param);
      var encMsg = fixedEncodeURIComponent(msg);

      var options = {
        hostname: 'api.twitter.com',
        path: '/1.1/statuses/update.json?possibly_sensitive=true&status=' + encMsg,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader
        }
      };

      var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        content = '';
        res.on('data', function(chunk) {
          content += chunk;
        });
        res.on('end', function() {
          var obj = JSON.parse(content);
          if (obj.errors) {
            client.say(to, JSON.stringify(obj.errors));
            console.log(obj.errors);
          } else {
            client.say(to, 'https://twitter.com/statuses/' + obj.id_str);
            saveResponse(obj, nick);
          }
        });
      });
      req.end();

      req.on('error', function(err) {
        console.error(err);
      });
    }

  };
}

module.exports = {
  name: 'tweet',
  desc: 'receives messages and tweets them',
  command: 'tweet',
  event: 'message',
  action: act
};

