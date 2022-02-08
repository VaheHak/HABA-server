const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Service = require("./service");

class ServiceDetails extends Model {

}

ServiceDetails.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('1','2'),
    allowNull: true,
  },
  maxCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: '1',
  },
  availableCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'serviceDetails',
  modelName: 'serviceDetails',
});

ServiceDetails.belongsTo(Service, {
  foreignKey: {
    name: 'serviceId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'serviceDetails',
});
Service.hasMany(ServiceDetails, {
  foreignKey: {
    name: 'serviceId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'details'
});

module.exports = ServiceDetails;
