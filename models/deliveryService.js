const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const Partner = require("./partner");
const PartnerBranch = require("./partnerBranch");
const Driver = require("./driver");
const Users = require("./user");

class DeliveryService extends Model {

}

DeliveryService.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		autoIncrement: true,
		primaryKey: true,
	},
	status: {
		type: DataTypes.ENUM('0', '1', '2', '3'),
		allowNull: true,
		defaultValue: '0',
	},
	pendingDate: {
		type: DataTypes.DATE,
		allowNull: true,
	},
	tookDate: {
		type: DataTypes.DATE,
		allowNull: true,
	},
	doneDate: {
		type: DataTypes.DATE,
		allowNull: true,
	},
	paymentMethod: {
		type: DataTypes.ENUM('1', '2', '3'),
		allowNull: true,
	},
	isOrderForAnother: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
	},
	senderName: {
		type: DataTypes.STRING,
		allowNull: true,
		trim: true,
	},
	senderPhoneNumber: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	senderAddress: {
		type: DataTypes.STRING,
		allowNull: true,
		trim: true,
	},
	senderCoordinates: {
		type: DataTypes.JSON,
		allowNull: true,
	},
	deliveryAddress: {
		type: DataTypes.STRING,
		allowNull: true,
		trim: true,
	},
	deliveryCoordinates: {
		type: DataTypes.JSON,
		allowNull: true,
	},
	customerName: {
		type: DataTypes.STRING,
		allowNull: true,
		trim: true,
	},
	customerPhoneNumber: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	deliveryPrice: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	orderPrice: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	buyForMe: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
	},
	storeAddress: {
		type: DataTypes.STRING,
		allowNull: true,
		trim: true,
	},
	storeCoordinates: {
		type: DataTypes.JSON,
		allowNull: true,
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true,
		trim: true,
	},
	route: {
		type: DataTypes.JSON,
		allowNull: true,
	},
	km: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
}, {
	sequelize: db,
	tableName: 'deliveryService',
	modelName: 'deliveryService',
	timestamps: true,
});

DeliveryService.belongsTo(Users, {
	foreignKey: {
		name: 'userId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'set null',
	as: 'deliveryServiceUser',
});
Users.hasMany(DeliveryService, {
	foreignKey: {
		name: 'userId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'set null',
	as: 'userDeliveryService'
});

DeliveryService.belongsTo(Partner, {
	foreignKey: {
		name: 'partnerId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'set null',
	as: 'deliveryServicePartner',
});
Partner.hasMany(DeliveryService, {
	foreignKey: {
		name: 'partnerId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'set null',
	as: 'partnerDeliveryService'
});

DeliveryService.belongsTo(PartnerBranch, {
	foreignKey: {
		name: 'partnerBranchId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'set null',
	as: 'deliveryServicePartnerBranch',
});
PartnerBranch.hasMany(DeliveryService);

DeliveryService.belongsTo(Driver, {
	foreignKey: {
		name: 'driverId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'set null',
	as: 'deliveryServiceDriver',
});
Driver.hasMany(DeliveryService);

module.exports = DeliveryService;
