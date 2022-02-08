const _ = require("lodash");
const Validate = require("../../config/validate");
const moment = require('moment');
const {successHandler} = require("../../utils/responseHandlers");
const Driver = require("../../models/driver");
const Clients = require("../../models/clients");
const DeliveryService = require("../../models/deliveryService");
const PartnerBranch = require("../../models/partnerBranch");
const sequelize = require("../../config/pool");

class StatisticController {

	static async getStatistics(req, res, next) {
		try {
			const {
				branchId, toStartDate, fromStartDate, deliveryToStartDate, deliveryFromStartDate
			} = req.query;
			await Validate(req.query, {
				branchId: 'integer|required|min:1',
				toStartDate: 'iso8601',
				fromStartDate: 'iso8601',
				deliveryToStartDate: 'iso8601',
				deliveryFromStartDate: 'iso8601',
			})

			let filter = {};
			if (fromStartDate || toStartDate){
				filter.createdAt = {
					$gte: fromStartDate ? new Date(moment(fromStartDate).format('YYYY-MM-DD 00:00:00')) : 0,
					$lte: toStartDate ? new Date(moment(toStartDate).format('YYYY-MM-DD 23:59:59')) : new Date(),
				};
			}

			let deliveryFilter = {};
			if (deliveryFromStartDate || deliveryToStartDate){
				deliveryFilter.createdAt = {
					$gte: deliveryFromStartDate ? new Date(moment(deliveryFromStartDate).format('YYYY-MM-DD 00:00:00')) : 0,
					$lte: deliveryToStartDate ? new Date(moment(deliveryToStartDate).format('YYYY-MM-DD 23:59:59')) : new Date(),
				};
			}

			const orderPrice = await DeliveryService.sum('orderPrice', {where: {partnerBranchId: branchId}});
			const deliveryPrice = await DeliveryService.sum('deliveryPrice', {where: {partnerBranchId: branchId}});
			const orders = await DeliveryService.count({where: {partnerBranchId: branchId}});
			const drivers = await Driver.count({
				where: {'$partnerBranchDrivers.id$': branchId}, include: [{
					model: PartnerBranch, as: 'partnerBranchDrivers', required: false,
				}]
			});
			const clients = await Clients.count({where: {branchId}});
			const allOrders = await DeliveryService.findAll({
				where: {...deliveryFilter, partnerBranchId: branchId},
				attributes: [
					[sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
					[sequelize.literal(`COUNT(*)`), 'count'],
				],
				group: [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
			});
			const allPrices = await DeliveryService.findAll({
				where: {...filter, partnerBranchId: branchId},
				attributes: ['id', 'orderPrice', 'createdAt'],
				order: [['createdAt', 'ASC']],
			});

			const result = successHandler("ok", {
				deliveryPrice,
				orderPrice,
				orders,
				drivers,
				clients,
				allOrders: allOrders || [],
				allPrices: allPrices || [],
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = StatisticController;
