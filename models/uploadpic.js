"use strict";

module.exports = function(sequelize, DataTypes) {
  var Uploadpic = sequelize.define("Uploadpic", {
    host: DataTypes.STRING,
    data: DataTypes.JSON,
    nick: DataTypes.STRING
  });
  return Uploadpic;
};
