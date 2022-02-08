const _ = require("lodash");
const Validate = require("../../config/validate");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const {
	transport_create, nothing_updated, transport_update, country_exist_err, city_exist_err, transport_delete,
	partner_exist_error, pBranch_exist_error, driver_exist_error, user_exist_error, create_delivery_service,
	update_delivery_service, deliveryService_delete, nothing_deleted, order_fail
} = require("../../utils/resMessage");
const DeliveryTransport = require("../../models/deliveryTransport");
const {getPagination, getPagingData} = require("../../config/pagination");
const Country = require("../../models/country");
const City = require("../../models/city");
const DeliveryService = require("../../models/deliveryService");
const Users = require("../../models/user");
const Partner = require("../../models/partner");
const PartnerBranch = require("../../models/partnerBranch");
const Driver = require("../../models/driver");
const DriverState = require("../../models/driverState");
const Car = require("../../models/car");
const PartnerDriver = require("../../models/partnerDriver");
const PartnerBranchDriver = require("../../models/partnerBranchDriver");
const {notifyInboxMessage} = require("../../config/pusher");
const sequelize = require("../../config/pool");
const httpError = require("http-errors");

const pageSize = 15;

class DeliveryController {

	static async getDeliveryTransports(req, res, next) {
		try {
			const {
				id, type, country, city, price, page = 1,
			} = req.query;
			await Validate(req.query, {
				id: 'integer|min:0',
				type: 'string|regex:[a-zA-Z0-9 ]$',
				make: 'string|regex:[a-zA-Z0-9 ]$',
				model: 'string|regex:[a-zA-Z0-9 ]$',
				country: 'integer|min:0',
				city: 'integer|min:0',
				price: 'integer|min:0',
			})

			let filter = {};
			if (id){
				filter.id = id
			}
			if (type){
				filter.type = {$like: `%${ type }%`}
			}
			if (country){
				filter.countryId = country
			}
			if (city){
				filter.cityId = city
			}
			if (price){
				filter.price = {$like: `${ price }%`}
			}

			const {limit, offset} = getPagination(page, pageSize);

			await DeliveryTransport.findAndCountAll({
				where: [filter],
				include: [{
					model: Country,
					as: 'deliveryTransportCountry',
					required: false,
				}, {
					model: City,
					as: 'deliveryTransportCity',
					required: false,
				}],
				offset: offset,
				limit: limit,
				distinct: true,
			}).then((data) => {
				const result = getPagingData(data, page, limit);
				const transport = successHandler('ok', result || [])
				return res.json(transport);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getDeliveryTransport(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			})

			let filter = {};
			if (id){
				filter.id = id
			}

			const result = await DeliveryTransport.findOne({
				where: [filter],
				include: [{
					model: Country,
					as: 'deliveryTransportCountry',
					required: false,
				}, {
					model: City,
					as: 'deliveryTransportCity',
					required: false,
				}],
				distinct: true,
			})

			const transport = successHandler('ok', result || {});
			return res.json(transport);
		} catch (e) {
			next(e);
		}
	}

	static async getServices(req, res, next) {
		try {
			const {page = 1, partner, branchId, startDate, endDate, address, status} = req.query;
			await Validate(req.query, {
				page: 'integer|min:0',
				partner: 'integer|min:0',
				branchId: 'integer|min:0',
				endDate: 'iso8601',
				startDate: 'iso8601',
				address: 'string|regex:[a-zA-Z0-9 ]$',
				status: 'integer|min:0',
			});

			let filter = {};
			if (startDate || endDate){
				filter.createdAt = {
					$gte: startDate ? new Date(startDate) : 0,
					$lte: endDate ? new Date(endDate) : new Date(),
				};
			}
			if (partner){
				filter.partnerId = partner
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

			const {limit, offset} = getPagination(page, pageSize);

			await DeliveryService.findAndCountAll({
				where: [filter],
				include: [{
					model: Users,
					as: 'deliveryServiceUser',
					required: false,
				}, {
					model: Partner,
					as: 'deliveryServicePartner',
					required: false,
					include: [{
						model: PartnerBranch,
						as: 'partnerBranches',
						required: false,
					}]
				}, {
					model: Driver,
					as: 'deliveryServiceDriver',
					required: false,
					include: [{
						model: DriverState,
						as: 'stateDriver',
						required: false,
					}, {
						model: Car,
						as: 'driverCars',
						required: false,
					}]
				}],
				offset: offset,
				limit: limit,
				order: [["createdAt", "DESC"]],
				distinct: true,
			}).then((data) => {
				const result = getPagingData(data, page, limit);
				const country = successHandler('ok', result || [])
				return res.json(country);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getService(req, res, next) {
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
				where: [filter],
				include: [{
					model: Users,
					as: 'deliveryServiceUser',
					required: false,
					attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
				}, {
					model: Partner,
					as: 'deliveryServicePartner',
					required: false,
					include: [{
						model: PartnerBranch,
						as: 'partnerBranches',
						required: false,
					}]
				}, {
					model: Driver,
					as: 'deliveryServiceDriver',
					required: false,
					include: [{
						model: DriverState,
						as: 'stateDriver',
						required: false,
					}, {
						model: Users,
						as: 'driverUser',
						required: false,
					}, {
						model: Car,
						as: 'driverCars',
						required: false,
					}]
				}],
			})

			const country = successHandler('ok', result || {})
			res.json(country);
		} catch (e) {
			next(e);
		}
	}

	static async addDeliveryTransport(req, res, next) {
		try {
			const {
				type, country, city, price
			} = req.body;
			await Validate(req.body, {
				type: 'string|required|regex:[a-zA-Z0-9 ]$',
				country: 'required|integer|min:0',
				city: 'required|integer|min:0',
				price: 'required|integer|min:0',
			})

			const transport = await DeliveryTransport.create({
				type, countryId: country ? country : null, cityId: city ? city : null, price: price ? price : null,
			})

			const result = successHandler(transport_create, transport)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async createService(req, res, next) {
		try {
			const {
				partner, partnerBranchId, driver, paymentMethod, isOrderForAnother, senderName, senderPhoneNumber, orderPrice,
				senderAddress, senderCoordinates, deliveryAddress, deliveryCoordinates, customerName, customerPhoneNumber,
				buyForMe, storeAddress, storeCoordinates, description, route
			} = req.body;
			await Validate(req.body, {
				partner: 'required|integer|min:0',
				partnerBranchId: 'required|integer|min:0',
				driver: 'required|integer|min:0',
				paymentMethod: 'integer|min:0',
				isOrderForAnother: 'boolean',
				senderName: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Z0-9 ]$',
				senderPhoneNumber: 'requiredIf:isOrderForAnother,true|string|minLength:9|phoneNumber',
				senderAddress: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Z0-9 ]$',
				senderCoordinates: 'requiredIf:isOrderForAnother,true|array|latLong|length:2',
				deliveryAddress: 'required|string|regex:[a-zA-Z0-9 ]$',
				deliveryCoordinates: 'required|array|latLong|length:2',
				customerName: 'required|string|regex:[a-zA-Z0-9 ]$',
				customerPhoneNumber: 'required|string|minLength:9|phoneNumber',
				orderPrice: 'required|integer|alphaDash|min:0',
				buyForMe: 'boolean',
				storeAddress: 'requiredIf:buyForMe,true|string|regex:[a-zA-Z0-9 ]$',
				storeCoordinates: 'requiredIf:buyForMe,true|array|latLong|length:2',
				description: 'requiredIf:buyForMe,true|string|regex:[a-zA-Z0-9 ]$',
				route: 'array|latLong|length:2',
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
				await DeliveryService.create({
					userId: req.userId ? req.userId : null, partnerId: partner, partnerBranchId, customerPhoneNumber, orderPrice,
					driverId: driver, paymentMethod, isOrderForAnother: isOrderForAnother ? isOrderForAnother : false,
					deliveryAddress, deliveryCoordinates, customerName, senderName: isOrderForAnother ? senderName : null,
					status: '0', deliveryPrice: p.deliveryPrice, senderPhoneNumber: isOrderForAnother ? senderPhoneNumber : null,
					senderAddress: isOrderForAnother ? senderAddress : null,
					senderCoordinates: isOrderForAnother ? senderCoordinates : null,
					buyForMe, storeAddress, storeCoordinates, description, route
				}, {transaction: t});

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

	static async updateDeliveryTransport(req, res, next) {
		try {
			const {
				id, type, country, city, price
			} = req.body;
			await Validate(req.body, {
				id: 'required|integer|min:0',
				type: 'string|regex:[a-zA-Z0-9 ]$',
				country: 'integer|min:0',
				city: 'integer|min:0',
				price: 'integer|min:0',
			})

			let toUpdate = {};
			if (type){
				toUpdate.type = type
			}
			if (country){
				const countryExist = await Country.findByPk(country);
				if (_.isEmpty(countryExist)){
					const error = errorHandler(country_exist_err);
					return res.json(error);
				}
				toUpdate.countryId = country
			}
			if (city){
				const cityExist = await City.findByPk(city);
				if (_.isEmpty(cityExist)){
					const error = errorHandler(city_exist_err);
					return res.json(error);
				}
				toUpdate.cityId = city
			}
			if (price){
				toUpdate.price = price
			}

			const transport = await DeliveryTransport.update({...toUpdate}, {where: {id}});

			const result = _.get(transport, 0) === 0 ? errorHandler(nothing_updated) : successHandler(transport_update, transport || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateService(req, res, next) {
		try {
			const {
				id, status, driver, paymentMethod, isOrderForAnother, senderName, senderPhoneNumber, orderPrice, deliveryPrice,
				senderAddress, senderCoordinates, deliveryAddress, deliveryCoordinates, customerName, customerPhoneNumber,
				buyForMe, storeAddress, storeCoordinates, description,
			} = req.body;
			await Validate(req.body, {
				id: 'required|integer|min:0',
				status: 'integer|min:0',
				driver: 'integer|min:0',
				paymentMethod: 'integer|min:0',
				isOrderForAnother: 'boolean',
				senderName: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Z0-9 ]$',
				senderPhoneNumber: 'requiredIf:isOrderForAnother,true|string|minLength:9|phoneNumber',
				senderAddress: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Z0-9 ]$',
				senderCoordinates: 'requiredIf:isOrderForAnother,true|array|latLong|length:2',
				deliveryAddress: 'string|regex:[a-zA-Z0-9 ]$',
				deliveryCoordinates: 'array|latLong|length:2',
				customerName: 'string|regex:[a-zA-Z0-9 ]$',
				customerPhoneNumber: 'string|minLength:9|phoneNumber',
				orderPrice: 'integer|alphaDash|min:0',
				deliveryPrice: 'integer|alphaDash|min:0',
				buyForMe: 'boolean',
				storeAddress: 'requiredIf:buyForMe,true|string|regex:[a-zA-Z0-9 ]$',
				storeCoordinates: 'requiredIf:buyForMe,true|array|latLong|length:2',
				description: 'requiredIf:buyForMe,true|string|regex:[a-zA-Z0-9 ]$',
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
			if (deliveryPrice) update.deliveryPrice = deliveryPrice;
			if (deliveryAddress) update.deliveryAddress = deliveryAddress;
			if (deliveryCoordinates) update.deliveryCoordinates = deliveryCoordinates;
			if (customerName) update.customerName = customerName;
			if (customerPhoneNumber) update.customerPhoneNumber = customerPhoneNumber;
			if (_.isBoolean(buyForMe)) update.buyForMe = buyForMe;
			if (storeAddress || buyForMe === false) update.storeAddress = buyForMe === false ? null : storeAddress;
			if (storeCoordinates || buyForMe === false) update.storeCoordinates = buyForMe === false ? null : storeCoordinates;
			if (description || buyForMe === false) update.description = buyForMe === false ? null : description;

			const deliveryService = await DeliveryService.update({...update}, {where: {id}});

			const result = _.get(deliveryService, 0) ? successHandler(update_delivery_service, deliveryService || [])
				: errorHandler(nothing_updated);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteDeliveryTransport(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const transport = await DeliveryTransport.destroy({
				where: {id},
				limit: 1
			});

			const result = transport === 0 ? errorHandler(nothing_deleted) : successHandler(transport_delete, transport)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteService(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const deliveryService = await DeliveryService.destroy({
				where: {id},
				limit: 1
			});

			const result = +deliveryService === 1 ? successHandler(deliveryService_delete, deliveryService) : errorHandler(nothing_deleted)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = DeliveryController;
