const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");

class PartnerBranchDriver extends Model {

}

PartnerBranchDriver.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
}, {
  sequelize: db,
  tableName: 'partner_branch_driver',
  modelName: 'partner_branch_driver',
});

module.exports = PartnerBranchDriver;
