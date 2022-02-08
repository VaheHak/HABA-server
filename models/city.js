const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Country = require("./country");

class City extends Model {

}

City.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  coords: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  isCanTakePassengers: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'cities',
  modelName: 'cities',
});

City.belongsTo(Country, {
  foreignKey: {
    name: 'countryId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'country',
});
Country.hasMany(City, {
  foreignKey: {
    name: 'countryId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'cities'
});

module.exports = City;
