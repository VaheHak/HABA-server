const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const City = require("./city");
const Ticket = require("./ticket");

class Cargo extends Model {

}

Cargo.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  state: {
    type: DataTypes.ENUM('1', '2', '3', '4'),
    allowNull: false,
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
  kg: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  senderPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  receiverPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'cargoDetails',
  modelName: 'cargoDetails',
});

Cargo.belongsTo(City, {
  foreignKey: {
    name: 'fromLocationId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'cargoFromLocation',
});
City.hasMany(Cargo, {
  foreignKey: {
    name: 'fromLocationId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'cargoFromLocations'
});

Cargo.belongsTo(City, {
  foreignKey: {
    name: 'toLocationId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'cargoToLocation',
});
City.hasMany(Cargo, {
  foreignKey: {
    name: 'toLocationId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'cargoToLocations'
});

Cargo.belongsTo(Ticket, {
  foreignKey: {
    name: 'ticketId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'cargoDetails',
});

Ticket.hasOne(Cargo, {
  foreignKey: {
    name: 'ticketId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'detailsCargo'
});

module.exports = Cargo;
