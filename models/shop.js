const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const DeliveryService = require("./deliveryService");

class Shop extends Model {

}

Shop.init({
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
	list: {
		type: DataTypes.TEXT,
		allowNull: true,
	},
}, {
	sequelize: db,
	tableName: 'shop',
	modelName: 'shop',
});

Shop.belongsTo(DeliveryService, {
	foreignKey: {
		name: 'orderId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'shopOrder',
});
DeliveryService.hasMany(Shop, {
	foreignKey: {
		name: 'orderId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'orderShops'
});

module.exports = Shop;
