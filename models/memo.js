"use strict";

module.exports = function(sequelize, DataTypes) {
  var Memo = sequelize.define("Memo", {
    nick: DataTypes.STRING,
    text: DataTypes.TEXT,
    cleared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });
  return Memo;
};
