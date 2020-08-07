"use strict";

module.exports = function(sequelize, DataTypes) {
  var Message = sequelize.define("Message", {
    prefix: DataTypes.STRING,
    nick: DataTypes.STRING,
    host: DataTypes.STRING,
    command: DataTypes.STRING,
    postedAt: DataTypes.DATE,
    postedAtDate: DataTypes.DATEONLY,
    text: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        Message.belongsTo(models.Channel, {
          foreignKey: {
            name: 'channel_id',
            allowNull: false
          }
        });
      }
    }
  });

  return Message;
};