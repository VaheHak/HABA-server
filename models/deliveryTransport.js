const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Country = require("./country");
const City = require("./city");
const Driver = require("./driver");

class DeliveryTransport extends Model {

}

DeliveryTransport.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('bicycle', 'motorcycle', 'car', 'mini truck', 'big truck', 'plane', 'ship', 'drone'),
    allowNull: true,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'deliveryTransport',
  modelName: 'deliveryTransport',
});

DeliveryTransport.belongsTo(Country, {
  foreignKey: {
    name: 'countryId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'set null',
  as: 'deliveryTransportCountry',
});
Country.hasMany(DeliveryTransport);

DeliveryTransport.belongsTo(City, {
  foreignKey: {
    name: 'cityId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'set null',
  as: 'deliveryTransportCity',
});
City.hasMany(DeliveryTransport);

DeliveryTransport.belongsTo(Driver, {
  foreignKey: {
    name: 'driverId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'set null',
  as: 'deliveryTransportDriver',
});
Driver.hasMany(DeliveryTransport);

module.exports = DeliveryTransport;
