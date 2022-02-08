const _ = require("lodash");
const Validate = require("../../config/validate");
const {getPagination, getPagingData} = require("../../config/pagination");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const DeliveryService = require("../../models/deliveryService");
const Users = require("../../models/user");
const Partner = require("../../models/partner");
const PartnerBranch = require("../../models/partnerBranch");
const Driver = require("../../models/driver");
const {
	partner_exist_error, pBranch_exist_error, driver_exist_error, create_delivery_service, user_exist_error,
	error_message_page, error_message_startDate, error_message_endDate, error_message_id, error_message_partner,
	error_message_customerName, error_message_partnerBranchId, error_message_driver, error_message_paymentMethod,
	error_message_isOrderForAnother, error_message_senderName, error_message_senderPhoneNumber,
	error_message_senderAddress, error_message_senderCoordinates, error_message_deliveryCoordinates,
	error_message_deliveryAddress, error_message_orderPrice, error_message_customerPhoneNumber,
} = require("../../utils/resMessage");
const DriverState = require("../../models/driverState");
const Car = require("../../models/car");
const PartnerDriver = require("../../models/partnerDriver");
const PartnerBranchDriver = require("../../models/partnerBranchDriver");

const pageSize = 15;

class DeliveryServiceController {

	static async getDeliveryOrders(req, res, next) {
		try {
			const {page = 1, startDate, endDate} = req.body;
			const errors = await Validate(req.body, {
				page: 'integer|min:0',
				endDate: 'iso8601',
				startDate: 'iso8601',
			}, void 0, true, void 0, {
				page: error_message_page, startDate: error_message_startDate, endDate: error_message_endDate,
			})
			if (errors){
				return res.json(errors);
			}

			let filter = {};
			if (startDate || endDate){
				filter.createdAt = {
					$gte: startDate ? new Date(startDate) : 0,
					$lte: endDate ? new Date(endDate) : new Date(),
				};
			}

			const {limit, offset} = getPagination(page, pageSize);

			await DeliveryService.findAndCountAll({
				where: [filter, {userId: req.userId}],
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

	static async getDeliveryOrder(req, res, next) {
		try {
			const {id} = req.body;
			const errors = await Validate(req.body, {
				id: 'required|integer|min:0',
			}, void 0, true, void 0, {id: error_message_id})
			if (errors){
				return res.json(errors);
			}

			let filter = {};
			if (id){
				filter.id = id;
			}

			const deliveryService = await DeliveryService.findOne({
				where: [filter, {userId: req.userId}],
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
				distinct: true,
			})

			const result = successHandler('ok', deliveryService || {})
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async createDeliveryOrders(req, res, next) {
		try {
			const {
				partner, partnerBranchId, driver, paymentMethod, isOrderForAnother, senderName, senderPhoneNumber, orderPrice,
				senderAddress, senderCoordinates, deliveryAddress, deliveryCoordinates, customerName, customerPhoneNumber,
			} = req.body;
			const errors = await Validate(req.body, {
				partner: 'integer|min:0',
				partnerBranchId: 'integer|min:0',
				driver: 'required|integer|min:0',
				paymentMethod: 'required|integer|min:0',
				isOrderForAnother: 'required|boolean',
				senderName: 'requiredIf:isOrderForAnother,true|string|regex:[a-zA-Z0-9 ]$',
				senderPhoneNumber: 'requiredIf:isOrderForAnother,true|string|minLength:9|phoneNumber',
				senderAddress: 'required|string|regex:[a-zA-Z0-9 ]$',
				senderCoordinates: 'required|array|latLong|length:2',
				deliveryAddress: 'required|string|regex:[a-zA-Z0-9 ]$',
				deliveryCoordinates: 'required|array|latLong|length:2',
				customerName: 'required|string|regex:[a-zA-Z0-9 ]$',
				customerPhoneNumber: 'required|string|minLength:9|phoneNumber',
				orderPrice: 'required|integer|alphaDash|min:0',
			}, {senderPhoneNumber, customerPhoneNumber}, true, void 0, {
				partner: error_message_partner,
				partnerBranchId: error_message_partnerBranchId,
				driver: error_message_driver,
				paymentMethod: error_message_paymentMethod,
				isOrderForAnother: error_message_isOrderForAnother,
				senderName: error_message_senderName,
				senderPhoneNumber: error_message_senderPhoneNumber,
				senderAddress: error_message_senderAddress,
				senderCoordinates: error_message_senderCoordinates,
				deliveryAddress: error_message_deliveryAddress,
				deliveryCoordinates: error_message_deliveryCoordinates,
				customerName: error_message_customerName,
				customerPhoneNumber: error_message_customerPhoneNumber,
				orderPrice: error_message_orderPrice,
			})
			if (errors){
				return res.json(errors);
			}
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

			const deliveryService = await DeliveryService.create({
				userId: req.userId ? req.userId : null, partnerId: partner, partnerBranchId, customerPhoneNumber, orderPrice,
				driverId: driver, paymentMethod, isOrderForAnother, deliveryAddress, deliveryCoordinates, customerName,
				senderName: isOrderForAnother ? senderName : null, status: '0', deliveryPrice: p.deliveryPrice,
				senderPhoneNumber: isOrderForAnother ? senderPhoneNumber : null, senderAddress, senderCoordinates,
			});

			const result = successHandler(create_delivery_service, deliveryService || []);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = DeliveryServiceController;
