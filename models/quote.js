"use strict";

module.exports = function(sequelize, DataTypes) {
  var Quote = sequelize.define("Quote", {
    nick: DataTypes.STRING,
    quote: DataTypes.TEXT,
    savedBy: DataTypes.STRING,
    lastPostedAt: DataTypes.DATE,
  });
  return Quote;
};
