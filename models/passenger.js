const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const City = require("./city");
const Ticket = require("./ticket");

class Passenger extends Model {

}

Passenger.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  state: {
    type: DataTypes.ENUM('1', '2', '3', '4'),
    allowNull: true,
    defaultValue: '1',
  },
  fromAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  toAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fromCity: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  toCity: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  toFixAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isChildPassenger: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  passengerPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passengerSeat: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'passengerDetails',
  modelName: 'passengerDetails',
});

Passenger.belongsTo(City, {
  foreignKey: {
    name: 'fromLocationId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'fromLocation',
});
City.hasMany(Passenger, {
  foreignKey: {
    name: 'fromLocationId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'fromLocations'
});

Passenger.belongsTo(City, {
  foreignKey: {
    name: 'toLocationId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'toLocation',
});
City.hasMany(Passenger, {
  foreignKey: {
    name: 'toLocationId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'toLocations'
});


Passenger.belongsTo(Ticket, {
  foreignKey: {
    name: 'ticketId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'passengerDetails',
});

Ticket.hasMany(Passenger, {
  foreignKey: {
    name: 'ticketId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'detailsPassenger'
});

module.exports = Passenger;
