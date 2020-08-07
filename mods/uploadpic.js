var fs       = require('fs');
var path     = require('path');
var FormData = require('form-data');
var models   = require('../models');
var yaml     = require('js-yaml');
var config   = yaml.safeLoad(fs.readFileSync(__dirname + '/../config/config.yaml', 'utf8'));


function validNumber(num_str) {
  var num = Number(num_str);
  if (!num_str) {
    return false;
  } else {
    return (num >= 1 && num <= 5);
  }
}

function act(app) {
  return function(nick, to, text, message) {

    var keywords = text.split(/[ ]+/g);
    keywords.map(function(kw) {
      kw.toLowerCase()
    });
    if (keywords[keywords.length-1] === '') {
      keywords.pop(); // remove trailing whitespace
    }

    if (keywords[0] === '.img') {
      var OPTIONS = config.mods.uploadpic.options;
      var DEFAULTCAT = config.mods.uploadpic.default;
      var DIR = OPTIONS[DEFAULTCAT][1];         // default source directory
      var UPCOUNT = 1;                    // default number of images to upload

      if (validateKeywords(keywords)) {
        pickImages(DIR, UPCOUNT);
      } else {
        help();
      }
    }

    function validateKeywords(keywords) {
      if (keywords.length > 3) {
        return false;
      }

      if (keywords.length === 2) {
        if (validNumber(keywords[1])) {
          UPCOUNT = Number(keywords[1]);
        } else if (keywords[1] in OPTIONS) {
          DIR = OPTIONS[keywords[1]][1];
        } else {
          return false;
        }
      }

      if (keywords.length === 3) {
        if (keywords[1] in OPTIONS && validNumber(keywords[2])) {
          UPCOUNT = Number(keywords[2]);
          DIR = OPTIONS[keywords[1]][1];
        } else {
          return false;
        }
      }
      return true;
    }

    function pickImages(dir, count) {
      var allowed = ['.jpg', '.png', '.gif', '.webm', '.mp4'];
      var images = [];
      var picked = [];

      fs.readdir(dir, function(err, files) {
        if (err)
          console.error(err);

        files.forEach(function(file) {
          if (allowed.indexOf(path.extname(file).toLowerCase()) > -1)
            images.push(file);
        });

        for (var i=0; i<count; i++) {
          picked.push(images[Math.floor(Math.random() * images.length)]);
        }
        console.log('Uploading: ', picked)
        uploadImages(picked);
      });
    }

    function uploadImages(filenames) {
      switch (config.mods.uploadpic.host) {
        case 'pomf': uploadPomf(filenames); break;
        case 'uguu': uploadUguu(filenames); break;
        case 'imgur': console.log('readd imgur upload'); break;
        default: console.log('No valid image host specified in config');
      }
    }

    function uploadPomf(filenames) {
      var form = new FormData();

      filenames.forEach(function(f) {
        form.append('files[]', fs.createReadStream(DIR + '/' + f));
      });

      form.submit('http://pomf.se/upload.php', function(err, res) {
        if (err)
          console.error(err);

        res.setEncoding('utf8');
        var content = ''
        res.on('data', function (chunk) {
          content += chunk;
        });

        res.on('end', function() {
          try {
            var pomf_res = JSON.parse(content);
          } catch (e) {
            console.log(e);
            app.say(to, e + ' (pomf.se down?)');
            return false;
          }
          if (pomf_res.success) {
            var urls = '';
            pomf_res.files.forEach(function(f) {
              urls += 'http://a.pomf.se/' + f.url + ' ';
            });
            app.say(to, urls);
          } else {
            app.say(to, 'Failed to upload images.');
          }
          storeUpload(pomf_res);
        })

        res.resume(); // for node-0.10.x
      });
    }

    function uploadUguu(filenames) {
      var imgUrls = "";
      var uppedCount = 0;
      var upped = {};

      filenames.forEach(function(file) {
        var form = new FormData();
        form.append('file', fs.createReadStream(DIR + '/' + file));
        form.submit({host: 'uguu.se', protocol: 'https:',  path: '/api.php?d=upload'}, function(err, res) {
          if (err) {
            app.say(to, 'Upload to uguu.se failed. (' + err.code + ')');
            return console.error('Upload to uguu.se failed: ' + err);
          }

          res.setEncoding('utf8');
          var html = '';

          res.on('data', function (chunk) {
            html += chunk;
          });

          res.on('end', function() {
            var match = /<p><a href="(https:\/\/a.uguu.se\/.*)">/g.exec(html);
            var url = match[1];
            upped[url] = file;
            imgUrls += url + " ";
            uppedCount++;
            if (uppedCount == filenames.length) {
              app.say(to, imgUrls);
              storeUpload(upped);
            }
          });
        });
      });
    }

    function storeUpload(hostResponse) {
      models.Uploadpic.create({
        host: config.mods.uploadpic.host,
        data: hostResponse,
        nick: nick
      }).then(function(instance) {
        console.log('Stored ' + instance.host + ' upload with id ' + instance.id + '.');
      }).catch(function(err) {
        console.error(err);
      });
    }

    function help() {
      app.notice(nick, 'Syntax: .img [category] [count(1-5)]. Default category is ' + DEFAULTCAT + '. Available categories are:');
      for (opt in OPTIONS) {
        app.notice(nick, '  ' + opt + '\t -  ' + OPTIONS[opt][0]);
      }
    }

  };
}

module.exports = {
  name: 'uploadpic',
  desc: 'uploads random img and posts link to chat',
  command: 'img',
  event: 'message',
  action: act
};
