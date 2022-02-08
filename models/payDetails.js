const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Ticket = require("./ticket");

class PayDetails extends Model {

}

PayDetails.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  method: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'payDetails',
  modelName: 'payDetails',
});


PayDetails.belongsTo(Ticket, {
  foreignKey: {
    name: 'ticketId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'payDetails',
});

Ticket.hasOne(PayDetails, {
  foreignKey: {
    name: 'ticketId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'detailsPay'
});

module.exports = PayDetails;
