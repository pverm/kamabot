'use strict';

var fs        = require('fs');
var path      = require('path');
var basename  = path.basename(module.filename);
var yaml      = require('js-yaml');
var config    = yaml.safeLoad(fs.readFileSync(__dirname + '/../config/config.yaml', 'utf8'));
var db        = {};
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.pg_uri, {
  logging: false
});

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename);
  })
  .forEach(function(file) {
    if (file.slice(-3) !== '.js') return;
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize.sync({force: false});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
