const _ = require("lodash");
const Validate = require("../../config/validate");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const {subQueryPaging} = require("../../config/pagination");
const DeliveryService = require("../../models/deliveryService");
const Users = require("../../models/user");
const Partner = require("../../models/partner");
const PartnerBranch = require("../../models/partnerBranch");
const Driver = require("../../models/driver");
const DriverState = require("../../models/driverState");
const Car = require("../../models/car");
const {
	partner_exist_error,
	pBranch_exist_error,
	driver_exist_error,
	user_exist_error,
	create_delivery_service,
	deliveryService_delete,
	nothing_updated,
	nothing_deleted,
	update_delivery_service,
	order_fail,
} = require("../../utils/resMessage");
const PartnerDriver = require("../../models/partnerDriver");
const PartnerBranchDriver = require("../../models/partnerBranchDriver");
const Clients = require("../../models/clients");
const {notifyInboxMessage} = require("../../config/pusher");
const sequelize = require("../../config/pool");
const httpError = require("http-errors");
const Promise = require("bluebird");
const Shop = require("../../models/shop");

const pageSize = 15;

class DeliveryServiceController {

	static async getOrders(req, res, next) {
		try {
			const {page = 1, branchId, startDate, endDate, address, status, driver} = req.query;
			await Validate(req.query, {
				page: 'integer|min:1',
				branchId: 'required|integer|min:0',
				endDate: 'iso8601',
				startDate: 'iso8601',
				address: 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				status: 'integer|min:0',
				driver: 'integer|min:1',
			});

			let filter = {};
			if (startDate || endDate){
				filter.createdAt = {
					$gte: startDate ? new Date(startDate) : 0, $lte: endDate ? new Date(endDate) : new Date(),
				};
			}
			if (branchId){
				filter.partnerBranchId = branchId
			}
			if (address){
				filter.deliveryAddress = {$like: `${ address }%`}
			}
			if (status){
				filter.status = status
			}
			if (driver){
				filter['$deliveryServiceDriver.id$'] = driver
			}

			await DeliveryService.findAndCountAll({
				where: [filter, {userId: req.userId}], include: [{
					model: Users, as: 'deliveryServiceUser', required: false,
				}, {
					model: Partner, as: 'deliveryServicePartner', required: false, include: [{
						model: PartnerBranch, as: 'partnerBranches', required: false,
					}]
				}, {
					model: Driver, as: 'deliveryServiceDriver', required: false, include: [{
						model: DriverState, as: 'stateDriver', required: false,
					}, {
						model: Users,
						as: 'driverUser',
						required: false,
						attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
					}, {
						model: Car, as: 'driverCars', required: false,
					}]
				}], order: [["createdAt", "DESC"]], distinct: true, subQuery: false,
			}).then((data) => {
				const result = subQueryPaging(data, page, pageSize);
				const country = successHandler('ok', result || [])
				return res.json(country);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getOrder(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			});

			let filter = {};
			if (id){
				filter.id = id
			}

			const result = await DeliveryService.findOne({
				where: [filter, {userId: req.userId}], include: [{
					model: Users,
					as: 'deliveryServiceUser',
					required: false,
					attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
				}, {
					model: Partner, as: 'deliveryServicePartner', required: false, include: [{
						model: PartnerBranch, as: 'partnerBranches', required: false,
					}]
				}, {
					model: Driver, as: 'deliveryServiceDriver', required: false, include: [{
						model: DriverState, as: 'stateDriver', required: false,
					}, {
						model: Users,
						as: 'driverUser',
						required: false,
						attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
					}, {
						model: Car, as: 'driverCars', required: false,
					}]
				}, {
					model: Shop, as: 'orderShops', required: false,
				}],
			})

			const country = successHandler('ok', result || {})
			res.json(country);
		} catch (e) {
			next(e);
		}
	}

	static async createOrder(req, res, next) {
		try {
			const {
				partner,
				partnerBranchId,
				driver,
				paymentMethod,
				isOrderForAnother,
				senderName,
				senderPhoneNumber,
				orderPrice,
				senderAddress,
				senderCoordinates,
				deliveryAddress,
				deliveryCoordinates,
				deliveryPrice,
				customerName,
				customerPhoneNumber,
				buyForMe,
				description,
				route,
				storeDetails,
			} = req.body;
			await Validate(req.body, {
				partner: 'required|integer|min:0',
				partnerBranchId: 'required|integer|min:0',
				driver: 'required|integer|min:0',
				paymentMethod: 'integer|min:0',
				isOrderForAnother: 'boolean',
				senderName: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				senderPhoneNumber: 'requiredIf:isOrderForAnother,true|string|minLength:9|phoneNumber',
				senderAddress: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				senderCoordinates: 'requiredIf:isOrderForAnother,true|array|latLong|length:2',
				deliveryAddress: 'required|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				deliveryCoordinates: 'array|latLong|length:2',
				customerName: 'required|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				customerPhoneNumber: 'required|string|minLength:9|phoneNumber',
				deliveryPrice: 'required|integer|alphaDash|min:0',
				orderPrice: 'integer|alphaDash|min:0',
				buyForMe: 'boolean',
				description: 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				route: 'array|latLong|length:2',
				storeDetails: 'array',
				'storeDetails.*.name': 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				'storeDetails.*.address': 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				'storeDetails.*.list': 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
			}, {senderPhoneNumber, customerPhoneNumber})

			const p = await Partner.findByPk(partner);
			if (_.isEmpty(p)){
				const error = errorHandler(partner_exist_error);
				return res.json(error);
			}
			const pB = await PartnerBranch.findByPk(partnerBranchId);
			if (_.isEmpty(pB)){
				const error = errorHandler(pBranch_exist_error);
				return res.json(error);
			}
			const d = await Driver.findByPk(driver);
			const pd = await PartnerDriver.findOne({where: {driverId: driver, partnerId: partner}});
			const pbd = await PartnerBranchDriver.findOne({where: {driverId: driver, partnerBranchId: partnerBranchId}});
			if (_.isEmpty(d) || !d.type.includes(2) || _.isEmpty(pd) || _.isEmpty(pbd)){
				const error = errorHandler(driver_exist_error);
				return res.json(error);
			}
			const u = await Users.findByPk(req.userId);
			if (_.isEmpty(u)){
				const error = errorHandler(user_exist_error);
				return res.json(error);
			}

			let t;
			try {
				t = await sequelize.transaction();
				const ds = await DeliveryService.findOne({where: {customerPhoneNumber}});
				if (ds){
					const c = await Clients.findOne({where: {phoneNumber: customerPhoneNumber}});
					if (_.isEmpty(c)){
						await Clients.create({name: customerName, phoneNumber: customerPhoneNumber, address: deliveryAddress});
					}
				}

				const deliveryService = await DeliveryService.create({
					userId: req.userId ? req.userId : null,
					partnerId: partner,
					partnerBranchId,
					customerPhoneNumber,
					orderPrice,
					driverId: driver,
					paymentMethod,
					isOrderForAnother: isOrderForAnother ? isOrderForAnother : false,
					deliveryAddress,
					deliveryCoordinates,
					customerName,
					senderName: isOrderForAnother ? senderName : null,
					status: '0',
					deliveryPrice: deliveryPrice,
					senderPhoneNumber: isOrderForAnother ? senderPhoneNumber : null,
					senderAddress: isOrderForAnother ? senderAddress : null,
					senderCoordinates: isOrderForAnother ? senderCoordinates : null,
					buyForMe,
					description,
					route
				}, {transaction: t});

				if (buyForMe && deliveryService && !_.isEmpty(storeDetails)){
					await Promise.map(storeDetails, async (v) => {
						return await Shop.create({
							orderId: deliveryService.id, name: v.name, address: v.address, list: v.list,
						})
					})
				}

				await Driver.increment({dailyPrice: deliveryPrice ? deliveryPrice : 0}, {where: {id: driver}});

				try {
					await notifyInboxMessage({
						name: p.name,
						id: Math.floor(Math.random() * 1000000),
						branch: pB,
						message: {customerName, customerPhoneNumber, deliveryAddress, deliveryCoordinates, orderPrice}
					}, d.userId);
				} catch (e) {
					throw httpError(500, e);
				}

				await t.commit();
			} catch (e) {
				if (t) await t.rollback();
				const result = errorHandler(order_fail);
				return res.json(result);
			}

			const result = successHandler(create_delivery_service);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateOrder(req, res, next) {
		try {
			const {
				id,
				status,
				driver,
				paymentMethod,
				isOrderForAnother,
				senderName,
				senderPhoneNumber,
				orderPrice,
				deliveryPrice,
				senderAddress,
				senderCoordinates,
				deliveryAddress,
				deliveryCoordinates,
				customerName,
				customerPhoneNumber,
				buyForMe,
				description,
				storeDetails,
			} = req.body;
			await Validate(req.body, {
				id: 'required|integer|min:1',
				status: 'integer|min:0',
				driver: 'integer|min:0',
				paymentMethod: 'integer|min:0',
				isOrderForAnother: 'boolean',
				senderName: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				senderPhoneNumber: 'requiredIf:isOrderForAnother,true|string|minLength:9|phoneNumber',
				senderAddress: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				senderCoordinates: 'requiredIf:isOrderForAnother,true|array|latLong|length:2',
				deliveryAddress: 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				deliveryCoordinates: 'array|latLong|length:2',
				customerName: 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				customerPhoneNumber: 'string|minLength:9|phoneNumber',
				orderPrice: 'integer|alphaDash|min:0',
				deliveryPrice: 'integer|alphaDash|min:0',
				description: 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				buyForMe: 'boolean',
				storeDetails: 'array',
				'storeDetails.*.id': 'integer|min:1',
				'storeDetails.*.name': 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				'storeDetails.*.address': 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				'storeDetails.*.list': 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
			}, {senderPhoneNumber, customerPhoneNumber})

			let update = {};
			if (driver){
				const d = await Driver.findByPk(driver);
				const ds = await DeliveryService.findByPk(id);
				const pd = await PartnerDriver.findOne({
					where: {driverId: driver, partnerId: ds.partnerId || ''}
				});
				const pbd = await PartnerBranchDriver.findOne({
					where: {driverId: driver, partnerBranchId: ds.partnerBranchId || ''}
				});
				if (_.isEmpty(d) || !d.type.includes(2) || _.isEmpty(pd) || _.isEmpty(pbd)){
					const error = errorHandler(driver_exist_error);
					return res.json(error);
				}
				update.driverId = driver;
			}
			if (status){
				update.status = status;
				if (+status === 1){
					update.pendingDate = new Date();
					update.tookDate = null;
					update.doneDate = null;
				}
				if (+status === 2){
					update.tookDate = new Date();
					update.doneDate = null;
				}
				if (+status === 3){
					update.doneDate = new Date();
				}
			}
			if (paymentMethod) update.paymentMethod = paymentMethod;
			if (_.isBoolean(isOrderForAnother)) update.isOrderForAnother = isOrderForAnother;
			if (senderName || isOrderForAnother === false) update.senderName = isOrderForAnother === false ? null : senderName;
			if (senderPhoneNumber || isOrderForAnother === false) update.senderPhoneNumber = isOrderForAnother === false ? null : senderPhoneNumber;
			if (senderAddress || isOrderForAnother === false) update.senderAddress = isOrderForAnother === false ? null : senderAddress;
			if (senderCoordinates || isOrderForAnother === false) update.senderCoordinates = isOrderForAnother === false ? null : senderCoordinates;
			if (orderPrice) update.orderPrice = orderPrice;
			if (deliveryPrice){
				update.deliveryPrice = deliveryPrice;
				const ds = await DeliveryService.findByPk(id);
				if (ds){
					await Driver.increment({dailyPrice: deliveryPrice}, {where: {id: ds.driverId}});
				}
			}
			if (deliveryAddress) update.deliveryAddress = deliveryAddress;
			if (deliveryCoordinates) update.deliveryCoordinates = deliveryCoordinates;
			if (customerName) update.customerName = customerName;
			if (customerPhoneNumber) update.customerPhoneNumber = customerPhoneNumber;
			if (_.isBoolean(buyForMe)) update.buyForMe = buyForMe;
			if (description) update.description = description;

			const deliveryService = await DeliveryService.update({...update}, {where: {id}});

			if (!_.isEmpty(storeDetails)){
				await Promise.map(storeDetails, async (v) => {
					if (v.id){
						return await Shop.update({name: v.name, address: v.address, list: v.list}, {where: {id: v.id}})
					} else{
						return await Shop.create({orderId: id, name: v.name, address: v.address, list: v.list})
					}
				})
			}

			const result = _.get(deliveryService, 0) ? successHandler(update_delivery_service, deliveryService || []) : errorHandler(nothing_updated);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteOrder(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const deliveryService = await DeliveryService.destroy({
				where: {id}, limit: 1
			});

			const result = +deliveryService === 1 ? successHandler(deliveryService_delete, deliveryService) : errorHandler(nothing_deleted)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = DeliveryServiceController;
