const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");

class Roles extends Model {

}

Roles.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize: db,
  tableName: 'roles',
  modelName: 'roles',
});

module.exports = Roles;
