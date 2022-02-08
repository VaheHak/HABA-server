const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Users = require("./user");

class Device extends Model {

}

Device.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		autoIncrement: true,
		primaryKey: true,
	},
	osType: {
		type: DataTypes.ENUM('1', '2'),
		allowNull: true,
	},
	deviceToken: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	deviceId: {
		type: DataTypes.STRING,
		allowNull: true,
	},
}, {
	sequelize: db,
	tableName: 'device',
	modelName: 'device',
});

Device.belongsTo(Users, {
	foreignKey: {
		name: 'userId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'deviceUser',
});
Users.hasOne(Device, {
	foreignKey: {
		name: 'userId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'userDevice'
});

module.exports = Device;
