const {Model, DataTypes} = require('sequelize');
const db = require("../config/pool");
const User = require("./user");
const Ticket = require("./ticket");
const Driver = require("./driver");
const PartnerDriver = require("./partnerDriver");

class Partner extends Model {

}

Partner.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		autoIncrement: true,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	image: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	deliveryPrice: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	membershipPrice: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	lastMembershipPayment: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	nextMembershipPayment: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	routes: {
		type: DataTypes.JSON,
		allowNull: true,
	},
	routePrice: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	subscribe: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
	},
	subscribePrice: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	subscribeDate: {
		type: DataTypes.DATE,
		allowNull: true,
	},
}, {
	sequelize: db,
	tableName: 'partner',
	modelName: 'partner',
});

Partner.belongsTo(User, {
	foreignKey: {
		name: 'userId',
		allowNull: false,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'partnerUser',
});
User.hasOne(Partner, {
	foreignKey: {
		name: 'userId',
		allowNull: false,
	},
	onUpdate: 'cascade',
	onDelete: 'cascade',
	as: 'userPartners',
});

Partner.belongsTo(Ticket, {
	foreignKey: {
		name: 'ticketId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'SET NULL',
	as: 'partnerTicket',
});
Ticket.hasOne(Partner, {
	foreignKey: {
		name: 'ticketId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'SET NULL',
	as: 'ticketPartners',
});

Partner.belongsToMany(Driver, {
	through: PartnerDriver,
	as: "partnerDrivers",
	foreignKey: {
		name: 'partnerId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'SET NULL',
});
Driver.belongsToMany(Partner, {
	through: PartnerDriver,
	as: "driverPartner",
	foreignKey: {
		name: 'driverId',
		allowNull: true,
	},
	onUpdate: 'cascade',
	onDelete: 'SET NULL',
});

module.exports = Partner;
