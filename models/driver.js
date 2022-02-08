const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Users = require("./user");
const Service = require("./service");

class Driver extends Model {

}

Driver.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		autoIncrement: true,
		primaryKey: true,
	},
	rating: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	status: {
		type: DataTypes.ENUM('1', '2'),
		allowNull: true,
		defaultValue: 1,
	},
	type: {
		type: DataTypes.JSON,
		allowNull: true,
	},
	avatar: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	coords: {
		type: DataTypes.JSON,
		allowNull: true,
	},
	dailyPrice: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	dailyDistance: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
}, {
	sequelize: db,
	tableName: 'drivers',
	modelName: 'drivers',
});

Driver.belongsTo(Users, {
	foreignKey: {
		name: 'userId',
		allowNull: false,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'driverUser',
});
Users.hasMany(Driver, {
	foreignKey: {
		name: 'userId',
		allowNull: false,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'userDriver'
});

Driver.belongsTo(Service, {
	foreignKey: {
		name: 'availableDrivers',
		allowNull: true,
	},
	onUpdate: 'SET NULL',
	onDelete: 'SET NULL',
	as: 'availDrivers',
});
Service.hasMany(Driver, {
	foreignKey: {
		name: 'availableDrivers',
		allowNull: true,
	},
	onUpdate: 'SET NULL',
	onDelete: 'SET NULL',
	as: 'driversAvailable'
});

Driver.belongsTo(Service, {
	foreignKey: {
		name: 'driver',
		allowNull: true,
	},
	onUpdate: 'SET NULL',
	onDelete: 'SET NULL',
	as: 'serviceDriver',
});
Service.hasOne(Driver, {
	foreignKey: {
		name: 'driver',
		allowNull: true,
	},
	onUpdate: 'SET NULL',
	onDelete: 'SET NULL',
	as: 'driverService'
});

module.exports = Driver;
