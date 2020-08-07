"use strict";

module.exports = function(sequelize, DataTypes) {
  var Tweet = sequelize.define("Tweet", {
    data: DataTypes.JSON,
    nick: DataTypes.STRING
  });
  return Tweet;
};
