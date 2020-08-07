var https = require('https');
var querystring = require('querystring');

const COMMAND = '.wiki';

function act(bot) {
  return function (nick, to, text, message) {

    var search_key = parseArgs(text);

    if (search_key) {
      var query_search = querystring.stringify({
        action: 'opensearch',
        search: search_key,
        format: 'json'
      });
      requestWiki(query_search, procResponse);
    }

    function parseArgs(argstr) {
      var args = argstr.split(' ');
      if (args[0] !== COMMAND) {
        return false;
      } else {
        return args.slice(1,args.length).join('_');
      }
    }

    function requestWiki(query, cb) {
      var options = {
        hostname: 'de.wikipedia.org',
        port: 443,
        path: '/w/api.php?' + query,
        method: 'GET',
        headers: {'user-agent': 'kamabot/1.0.0'}
      };

      var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        var content = '';
        res.on('data', function(chunk) {
          content += chunk;
        });
        res.on('end', function() {
          cb(JSON.parse(content));
        })
      });
      req.end();
      req.on('error', function(err) {
        console.error(err);
      });
    }

    function procResponse(obj) {
      if (obj.query) {                // query response
        procResponseQuery(obj);
      } else if (obj[1].length > 0) { // search response hit
        procResponseSearch(obj);
      } else {                        // no hit
        bot.say(to, 'Couldn\'t find "' + text.slice(6) + '".')
      }
    }

    function procResponseQuery(obj) {
      for (p in obj.query.pages) {
        var page = obj.query.pages[p];
        if (page.revisions[0]['*'].indexOf('#WEITERLEITUNG') === 0) {
          bot.say(to, 'redirects not supported yet (ever)');
        } else {
          bot.say(to, page.extract);
        }
        bot.say(to, 'Read more on ' + page.fullurl);
      }
    }

    function procResponseSearch(obj) {
      var query_direct = querystring.stringify({
        action: 'query',
        titles: (obj[1].length > 0)
          ? obj[1][0]
          : search_key,
        prop: 'info|categories|extracts|revisions',
        rvprop: 'content',
        exintro: true,
        explaintext: true,
        exchars: 400,
        inprop: 'url',
        format: 'json'
      });
      requestWiki(query_direct, procResponse)

    }

    function procRedirect() {
      console.log('');
    }

  };
}

// http://de.wikipedia.org/w/api.php?action=query&prop=revisions|info|categories&rvprop=content&inprop=url&format=jsonfm&titles=Kategorie

module.exports = {
  name: 'wikiinfo',
  desc: 'search keywords in wikipedia and post result to chat',
  command: 'wiki',
  event: 'message',
  action: act
};
