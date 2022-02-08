const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Service = require("./service");
const User = require("./user");
const ServiceDetails = require("./serviceDetails");

class Ticket extends Model {

}

Ticket.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  promoCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('1', '2', '3', '4'),
    allowNull: false,
    defaultValue: '1',
  },
  createdDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'ticket',
  modelName: 'ticket',
});

Ticket.belongsTo(Service, {
  foreignKey: {
    name: 'serviceId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'ticketService',
});
Service.hasMany(Ticket, {
  foreignKey: {
    name: 'serviceId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'serviceTickets'
});

Ticket.belongsTo(ServiceDetails, {
  foreignKey: {
    name: 'serviceDetailsId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'serviceTicket',
});
ServiceDetails.hasMany(Ticket, {
  foreignKey: {
    name: 'serviceDetailsId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'ticket'
});

Ticket.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'ticketUser',
});
User.hasMany(Ticket, {
  foreignKey: {
    name: 'userId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
  as: 'userTickets'
});

module.exports = Ticket;
