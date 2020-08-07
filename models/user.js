"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9\_\-]+$/i,
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    /**
     * user classes:
     *   0 - inactive
     *   1 - reserved
     *   2 - member
     *   3 - mod
     *   4 - admin
     *   5 - owner
     */
    class: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    linked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    linkedNick: DataTypes.STRING,
    linkPass: DataTypes.STRING,
    linkPassValidUntil: DataTypes.DATE,
    password: DataTypes.STRING,
    salt: DataTypes.STRING,
    lastLogin: DataTypes.DATE,
    avatar: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        User.belongsTo(models.Server, {
          foreignKey: {
            name: 'linkedServerId',
            allowNull: true,
            onDelete: 'CASCADE'
          }
        });
        User.hasMany(models.Task, {
          onDelete: "CASCADE"
        });
      }
    },
    indexes: [{
      name: 'unique_name',
      unique: true,
      fields: [sequelize.fn('lower', sequelize.col('name'))]
    },{
      name: 'unique_email',
      unique: true,
      fields: [sequelize.fn('lower', sequelize.col('email'))]
    }]
  });
  return User;
};
