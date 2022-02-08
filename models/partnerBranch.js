const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Partner = require("./partner");
const Country = require("./country");
const City = require("./city");
const Driver = require("./driver");
const PartnerDriver = require("./partnerDriver");
const PartnerBranchDriver = require("./partnerBranchDriver");

class PartnerBranch extends Model {

}

PartnerBranch.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isGeneral: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  coords: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'partnerBranch',
  modelName: 'partnerBranch',
});

PartnerBranch.belongsTo(Partner, {
  foreignKey: {
    name: 'partnerId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'branchPartner',
});
Partner.hasMany(PartnerBranch, {
  foreignKey: {
    name: 'partnerId',
    allowNull: false,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'partnerBranches',
});

PartnerBranch.belongsTo(Country, {
  foreignKey: {
    name: 'countryId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'branchCountry',
});
Country.hasMany(PartnerBranch, {
  foreignKey: {
    name: 'countryId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'countryBranches',
});

PartnerBranch.belongsTo(City, {
  foreignKey: {
    name: 'cityId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'branchCity',
});
City.hasMany(PartnerBranch, {
  foreignKey: {
    name: 'cityId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'cascade',
  as: 'cityBranches',
});

PartnerBranch.belongsToMany(Driver, {
  through: PartnerBranchDriver,
  as: "driverPartnerBranches",
  foreignKey: {
    name: 'partnerBranchId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
});
Driver.belongsToMany(PartnerBranch, {
  through: PartnerBranchDriver,
  as: "partnerBranchDrivers",
  foreignKey: {
    name: 'driverId',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'SET NULL',
});

module.exports = PartnerBranch;
