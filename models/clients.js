const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const PartnerBranch = require("./partnerBranch");

class Clients extends Model {

}

Clients.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		autoIncrement: true,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	address: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	phoneNumber: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: 'c_phone',
	},
	email: {
		type: DataTypes.STRING,
		allowNull: true,
		unique: 'c_email',
	},
}, {
	sequelize: db,
	tableName: 'clients',
	modelName: 'clients',
});

Clients.belongsTo(PartnerBranch, {
	foreignKey: {
		name: 'branchId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'clientPartnerBranch',
});
PartnerBranch.hasMany(Clients, {
	foreignKey: {
		name: 'branchId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'partnerBranchClient'
});

module.exports = Clients;
