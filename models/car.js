const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Driver = require("./driver");

class Car extends Model {

}

Car.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  make: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  year: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passengersSeat: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'cars',
  modelName: 'cars',
});

Car.belongsTo(Driver, {
  foreignKey: {
    name: 'driverId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'driver',
});
Driver.hasOne(Car, {
  foreignKey: {
    name: 'driverId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'driverCars'
});

module.exports = Car;
