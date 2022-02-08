const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");

class Country extends Model {

}

Country.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'country',
  },
  coords: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'countries',
  modelName: 'countries',
});

module.exports = Country;
