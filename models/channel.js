"use strict";

module.exports = function(sequelize, DataTypes) {
  var Channel = sequelize.define("Channel", {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Channel.belongsTo(models.Server, {
          foreignKey: {
            name: 'server_id',
            allowNull: false
          }
        });
        Channel.hasMany(models.Message, { foreignKey: 'channel_id' });
      }
    }
  });

  return Channel;
};
