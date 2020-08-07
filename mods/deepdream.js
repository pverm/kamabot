var request = require('superagent');
var path = require('path');
var url = require('url');
var fs = require('fs');
var randomstring = require('randomstring');
var req = require('request');

function getName(uri) {
	var parsed = url.parse(uri);
	return path.basename(parsed.pathname);
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var filters = [
  "sandstorm",
  "snow_crash",
  "inceptionist_painting",
  "salvia",
  "art_deco",
  "painting",
  "mirage",
  "energy_buzz",
  "facelift",
  "charcoal",
  "trippy",
  "self_transforming_machine_elves",
  "botanical_dimensions",
  "digital_prism",
  "sketchasketch",
  "dead_presidents",
  "digital_weave",
  "mystery_flavor",
  "supertrippy",
  "jeweled_bird",
  "engraved_clay",
  "crayon",
  "stained_glass",
  "blotting_paper",
  "oil_on_canvas",
  "shimmer",
  "drought",
  "blur",
  "median"
];

function act(bot) {
  return function(nick, to, text, message) {

    var keywords = text.split(' ');

    if (keywords[0].toLowerCase() === '.deepdream') {
      if (keywords[1] && (endsWith(keywords[1], '.jpg') || endsWith(keywords[1], '.png'))) {
        var filter = getFilter(keywords[2]);
        downImg(keywords[1], getDreamImg);
      } else {
        bot.say(to, 'Create a deep dream image');
        bot.say(to, '  .deepdream <image url (jpg/png)> <filter (optional)>');
        bot.say(to, '  filters: ' + filters.toString());
      }
    }

    function getFilter(kw) {
      if (filters.indexOf(kw) > 0)
        return kw;
      else
        return 'trippy';
    }

    function downImg(url, cb) {
      req.head(url, function(err, res, body) {
        //console.log('content-type:', res.headers['content-type']);
        //console.log('content-length:', res.headers['content-length']);

        var imgpath = './mods/moddata/deepdream/' + getName(url);
        req(url).pipe(fs.createWriteStream(imgpath)).on('close', function() {
          bot.notice(nick, 'DeepDream: downloaded image');
          cb(imgpath);
        });
      });
    }

    function getDreamImg(filename) {

      var dsurl = 'https://dreamscopeapp.com/api/images';
      var outputFilename = './static/files/filtered-' + path.basename(filename);

      request
        .post(dsurl)                  // this is a POST request
        .field('filter', filter)      // the "filter" parameter
        .attach('image', filename)    // attach the file as "image"
        .end(function(err, res) {     // callback for the response

          if (err) return console.log(err); // log error and quit

          //console.log(res.headers);
          //console.log(res.body);
          bot.notice(nick, 'DeepDream: processing image')

          // compute the polling URL
          var poll_url = dsurl + '/' + res.body.uuid;

          // This function calls itself repeatedly to check the processing_status
          // of the image until the filtered image is available.
          // When the image has finished processing, it will download the result.
          var poll = function() {
            request.get(poll_url, function(err, res) {
              if (!err && res.statusCode == 200) { 
                //console.log(res.headers);
                //console.log(res.body);

                var body = res.body;

                // check if processing has finished
                if (body.processing_status == 2 && body.filtered_url) {

                  // download filtered image and save it to a file
                  request
                    .get(body.filtered_url)
                    .pipe(fs.createWriteStream(outputFilename))
                    .on('finish', function() {
                      bot.say(to, 'DeepDream: http://' + bot.express.url + '/files/' + path.basename(outputFilename));
                    });

                } else {
                  // still processing � we'll try again in a second
                  setTimeout(poll, 1000);
                }
              } else { // log error
                console.log(err);
              }
            });
          };

          // Start polling
          poll();
        });

    }

  }
}

module.exports = {
  name: 'deepdream',
  desc: 'create deep dream picture',
  event: 'message',
  action: act
};
