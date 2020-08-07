"use strict";

module.exports = function(sequelize, DataTypes) {
  var Server = sequelize.define("Server", {
    name: { type: DataTypes.STRING, unique: true }
  }, {
    classMethods: {
      associate: function(models) {
        Server.hasMany(models.Channel, { foreignKey: 'server_id' });
      }
    }
  });

  return Server;
};
