var fs = require('fs');
var https = require('https');

var pattern = /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=))([\w\-]{10,12})\b/

function act(app) {
  return function(nick, to, text, message) {

    var url = text.match(pattern);

    if (url) {
      if (app.modconf.youtubeinfo.apikey) {
        var YOUTUBE_API_KEY = app.modconf.youtubeinfo.apikey;
      } else {
        var YOUTUBE_API_KEY = undefined;
        console.error('no youtube api key set in config.yaml');
      }

      if (YOUTUBE_API_KEY) {
        var videoid = url[1];
        var options = {
          hostname: 'www.googleapis.com',
          port: 443,
          path: '/youtube/v3/videos?part=snippet%2C+contentDetails' +
            '&id=' + videoid +
            '&key=' + YOUTUBE_API_KEY,
          method: 'GET'
        };

        var info;
        var req = https.request(options, function(res) {
          res.setEncoding('utf8');
          content = '';
          res.on('data', function (chunk) {content += chunk;});
          res.on('end', function() {
            announce(JSON.parse(content));
          });
        });
        req.end();

      }
    }

    function announce(videoJSON) {
      if (videoJSON.pageInfo.totalResults == 0)
        return; // video may be blocked or removed
      var title = videoJSON.items[0].snippet.title;
      var channel = videoJSON.items[0].snippet.channelTitle;
      var definition = videoJSON.items[0].contentDetails.definition.toUpperCase();
      var durationISO = videoJSON.items[0].contentDetails.duration;

      function formatDuration(isoStr) {
        isoStr = isoStr.slice(2);
        var duration = '';
        var arr = [];

        ['H', 'M', 'S'].forEach(function(t) {
          arr = isoStr.split(t);
          if (arr.length === 1)
            duration += '00:'
          else {
            duration += ((arr[0].length<2) ? '0'+arr[0] : arr[0]) + ':'
            isoStr = arr[1];
          }
        });

        if (duration.slice(0,2) === '00')
          return duration.slice(3,-1);
        else
          return duration.slice(0,-1);
      }

      var duration = formatDuration(durationISO);
      var desc_long = videoJSON.items[0].snippet.description;
      if (desc_long.length >= 77)
        desc = desc_long.slice(0,77) + '...';
      else
        desc = desc_long;

      var msg = '"' + title + '" [' +
        channel + '] [' +
        duration + '] [' +
        definition + ']';

      app.say(to, msg);
      //console.log(videoJSON.items[0].contentDetails);
      //console.log(videoJSON.items[0].snippet);
    }

  };
}

module.exports = {
  name: 'youtubeinfo',
  desc: 'post information about youtube link to chat',
  event: 'message',
  action: act
};
