const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Driver = require("./driver");

class DriverState extends Model {

}

DriverState.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  state: {
    type: DataTypes.ENUM('1', '2', '3'),
    allowNull: true,
    defaultValue: 1,
  },
  orderType: {
    type: DataTypes.ENUM('1', '2'),
    allowNull: true,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'driverState',
  modelName: 'driverState',
});

DriverState.belongsTo(Driver, {
  foreignKey: {
    name: 'driverId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'driverState',
});
Driver.hasMany(DriverState, {
  foreignKey: {
    name: 'driverId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'stateDriver'
});

module.exports = DriverState;
