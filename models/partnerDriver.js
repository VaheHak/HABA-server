const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");

class PartnerDriver extends Model {

}

PartnerDriver.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
}, {
  sequelize: db,
  tableName: 'partner_driver',
  modelName: 'partner_driver',
});

module.exports = PartnerDriver;
