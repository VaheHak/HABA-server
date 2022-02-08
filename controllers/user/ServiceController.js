const _ = require("lodash");
const Promise = require('bluebird');
const sequelize = require('../../config/pool');
const {
	available_count_error,
	user_exist_err,
	error_message_fromCity,
	error_message_toCity,
	error_message_id,
	service_exist_error,
	city_exist_error,
	payment_success,
	payment_fail,
	country_exist_error,
	error_message_country,
	error_message_city, service_error,
	orderId_error,
	status_error,
	price_error,
	method_error,
	promoCode_error,
	receiverPhoneNumber_error,
	senderPhoneNumber_error,
	description_error,
	kg_error,
	passengerSeat_error,
	passengerPhoneNumber_error,
	toAddress_error,
	fromAddress_error,
	toCity_error,
	fromCity_error,
	state_error,
	isChildPassenger_error,
	details_error,
	serviceType_error,
} = require("../../utils/resMessage");
const Validate = require("../../config/validate");
const Users = require("../../models/user");
const {errorHandler, successHandler} = require("../../utils/responseHandlers");
const ServiceDetails = require("../../models/serviceDetails");
const Service = require("../../models/service");
const Ticket = require("../../models/ticket");
const Passenger = require("../../models/passenger");
const Cargo = require("../../models/cargo");
const PayDetails = require("../../models/payDetails");
const City = require("../../models/city");
const Route = require("../../models/route");
const Country = require("../../models/country");
const DeliveryTransport = require("../../models/deliveryTransport");

class ServiceController {

	static async getServiceDates(req, res, next) {
		try {
			const {fromCity, toCity} = req.body;
			const errors = await Validate(req.body, {
					fromCity: 'required|integer|min:0',
					toCity: 'required|integer|min:0',
				}, void 0, true, void 0,
				{fromCity: error_message_fromCity, toCity: error_message_toCity})
			if (errors){
				return res.status(200).json(errors);
			}

			const cityTo = await City.findByPk(toCity);
			const cityFrom = await City.findByPk(fromCity);
			if (!cityTo || !cityFrom){
				const error = errorHandler(city_exist_error);
				return res.json(error);
			}

			let filter = {};
			if (fromCity){
				filter.from = fromCity;
			}
			if (toCity){
				filter.to = toCity;
			}

			const result = await Service.findAll({
				where: {startDate: {$gte: new Date()}},
				include: [{
					model: ServiceDetails,
					as: 'details',
					required: true,
					where: {type: 1},
				}, {
					model: Route,
					as: 'route',
					required: true,
					where: [filter],
					attributes: [],
				}],
				order: [['startDate', 'ASC']],
				distinct: true,
			})

			const service = successHandler('ok', result || [])
			return res.json(service);
		} catch (e) {
			next(e);
		}
	}

	static async getServicePassengers(req, res, next) {
		try {
			const {id} = req.body;
			const errors = await Validate(req.body, {
				id: 'required|integer|min:0',
			}, void 0, true, void 0, {id: error_message_id,})
			if (errors){
				return res.status(200).json(errors);
			}

			const s = await Service.findByPk(id);
			if (!s){
				const error = errorHandler(service_exist_error);
				return res.json(error);
			}

			let filter = {};
			if (id){
				filter.id = id;
			}

			const result = await Service.findOne({
				where: [filter], include: [{
					model: ServiceDetails,
					as: 'details',
					required: true,
					where: {type: 1},
					attributes: ["id", "maxCount", "availableCount"],
				}], raw: true, plain: true, attributes: ['id'],
			});

			const service = successHandler('ok', result || [])
			return res.json(service);
		} catch (e) {
			next(e);
		}
	}

	static async getDeliveryTransports(req, res, next) {
		try {
			const {country, city} = req.body;
			const errors = await Validate(req.body, {
				country: 'required|integer|min:0', city: 'required|integer|min:0',
			}, void 0, true, void 0, {country: error_message_country, city: error_message_city})
			if (errors){
				return res.json(errors);
			}

			let filter = {};
			if (country){
				const c = await Country.findByPk(country);
				if (!c){
					const error = errorHandler(country_exist_error);
					return res.json(error);
				}
				filter.countryId = country;
			}
			if (city){
				const c = await City.findByPk(city);
				if (!c){
					const error = errorHandler(city_exist_error);
					return res.json(error);
				}
				filter.cityId = city;
			}

			const result = await DeliveryTransport.findAll({
				where: [filter], include: [{
					model: Country, as: 'deliveryTransportCountry', required: false,
				}, {
					model: City, as: 'deliveryTransportCity', required: false,
				}], distinct: true,
			})

			const service = successHandler('ok', result || [])
			return res.json(service);
		} catch (e) {
			next(e);
		}
	}

	static async getServiceWeights(req, res, next) {
		try {
			const {fromCity, toCity} = req.body;
			const errors = await Validate(req.body, {
				fromCity: 'required|integer|min:0', toCity: 'required|integer|min:0',
			}, void 0, true, void 0, {fromCity: error_message_fromCity, toCity: error_message_toCity})
			if (errors){
				return res.json(errors);
			}

			const cityTo = await City.findByPk(toCity);
			const cityFrom = await City.findByPk(fromCity);
			if (!cityTo || !cityFrom){
				const error = errorHandler(city_exist_error);
				return res.json(error);
			}

			let filter = {};
			if (fromCity){
				filter.from = fromCity;
			}
			if (toCity){
				filter.to = toCity;
			}

			const result = await Service.findAll({
				where: {startDate: {$gte: new Date()}}, include: [{
					model: ServiceDetails,
					as: 'details',
					required: true,
					where: {type: 2},
					attributes: ["id", "maxCount", "availableCount"],
				}, {
					model: Route, as: 'route', required: true, where: [filter], attributes: [],
				}], raw: true, plain: true, attributes: ['id', 'startDate'], order: [['startDate', 'ASC']], distinct: true,
			})

			const service = successHandler('ok', result || [])
			return res.json(service);
		} catch (e) {
			next(e);
		}
	}

	static async createTicket(req, res, next) {
		try {
			const {service, serviceType, details, promoCode, method, price, orderId, status} = req.body;
			const errors = await Validate(req.body, {
				service: 'integer|required|min:0',
				serviceType: 'integer|required|min:0',
				details: 'required|array',
				'details.*.isChildPassenger': 'boolean',
				'details.*.state': 'integer|min:0',
				'details.*.fromCity': 'required|array|latLong|length:2',
				'details.*.toCity': 'required|array|latLong|length:2',
				'details.*.fromAddress': 'required|string|regex:[a-zA-Z0-9 ]$',
				'details.*.toAddress': 'required|string|regex:[a-zA-Z0-9 ]$',
				'details.*.passengerPhoneNumber': 'string|minLength:9|phoneNumber',
				'details.*.passengerSeat': 'integer|min:0',
				'details.*.kg': 'integer|min:0',
				'details.*.description': 'string|regex:[a-zA-Z0-9 ]$',
				'details.*.senderPhoneNumber': 'string|minLength:9|phoneNumber',
				'details.*.receiverPhoneNumber': 'string|minLength:9|phoneNumber',
				promoCode: 'string|alphaDash',
				method: 'required|string|alphaDash',
				price: 'required|integer|min:0',
				status: 'integer|min:0',
				orderId: 'alphaDash',
			}, {
				passengerPhoneNumber: details && details[0] && details[0].passengerPhoneNumber ? details[0].passengerPhoneNumber : '',
				senderPhoneNumber: details && details[0] && details[0].senderPhoneNumber ? details[0].senderPhoneNumber : '',
				receiverPhoneNumber: details && details[0] && details[0].receiverPhoneNumber ? details[0].receiverPhoneNumber : '',
			}, true, void 0, {
				service: service_error,
				serviceType: serviceType_error,
				details: details_error,
				'details.*.isChildPassenger': isChildPassenger_error,
				'details.*.state': state_error,
				'details.*.fromCity': fromCity_error,
				'details.*.toCity': toCity_error,
				'details.*.fromAddress': fromAddress_error,
				'details.*.toAddress': toAddress_error,
				'details.*.passengerPhoneNumber': passengerPhoneNumber_error,
				'details.*.passengerSeat': passengerSeat_error,
				'details.*.kg': kg_error,
				'details.*.description': description_error,
				'details.*.senderPhoneNumber': senderPhoneNumber_error,
				'details.*.receiverPhoneNumber': receiverPhoneNumber_error,
				promoCode: promoCode_error,
				method: method_error,
				price: price_error,
				status: status_error,
				orderId: orderId_error,
			})
			if (errors){
				return res.json(errors);
			}

			const exist = await Users.findByPk(req.userId);
			if (_.isEmpty(exist)){
				const error = errorHandler(user_exist_err);
				return res.json(error);
			}

			const serviceId = await (await Service.findOne({
				where: {id: service}, include: [{
					model: ServiceDetails, as: 'details', required: false,
				}]
			})).toJSON();
			if (_.isEmpty(serviceId)){
				const error = errorHandler(service_exist_error);
				return res.json(error);
			}

			const detail = _.find(serviceId.details ? serviceId.details : [],
				{'type': typeof serviceType === "string" ? serviceType : serviceType.toString()});
			if (detail && +detail.availableCount === 0){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}
			if (+serviceType === 1 && detail && details && +details.length > +detail.availableCount){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}
			if (+serviceType === 2 && detail && _.get(details, 0) && _.get(details, 0).kg && _.get(details, 0).kg > +detail.availableCount){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}

			let t;
			try {
				t = await sequelize.transaction();

				const ticket = await Ticket.create({
					promoCode,
					status: status ? +status : 1,
					serviceId: service ? +service : null,
					userId: req.userId ? +req.userId : null,
					serviceDetailsId: detail ? +detail.id : null,
				}, {transaction: t});

				if (!_.isEmpty(ticket)){
					if (detail && +serviceType === 1){
						if (!_.isEmpty(details)){
							await Promise.map(details, async (d) => {
								await Passenger.create({
									state: d.state,
									fromAddress: d.fromAddress,
									toAddress: d.toAddress,
									passengerSeat: d.passengerSeat || null,
									isChildPassenger: d.isChildPassenger,
									passengerPhoneNumber: d.passengerPhoneNumber ? d.passengerPhoneNumber : null,
									fromCity: d.fromCity || null,
									toCity: d.toCity || null,
									ticketId: ticket.id,
								}, {transaction: t});
								await ServiceDetails.update({
									availableCount: +detail.availableCount - 1
								}, {where: {id: detail.id}, transaction: t});
							})
						}
					}

					if (detail && +serviceType === 2){
						let cargo;
						if (!_.isEmpty(details)){
							await Promise.map(details, async (d) => {
								cargo = await Cargo.create({
									state: d.state,
									fromAddress: d.fromAddress,
									toAddress: d.toAddress,
									kg: +d.kg || null,
									description: d.description,
									fromCity: d.fromCity || null,
									toCity: d.toCity || null,
									senderPhoneNumber: d.senderPhoneNumber ? d.senderPhoneNumber : null,
									receiverPhoneNumber: d.receiverPhoneNumber ? d.receiverPhoneNumber : null,
									ticketId: ticket.id,
								}, {transaction: t});
							})
						}
						if (cargo && cargo.kg && +cargo.kg <= +detail.availableCount){
							await ServiceDetails.update({
								availableCount: +detail.availableCount - +cargo.kg
							}, {where: {id: detail.id}, transaction: t});
						}
					}

					await PayDetails.create({
						method, price: price ? price : null, orderId, ticketId: +ticket.id
					}, {transaction: t});
				}

				await t.commit();
			} catch (error) {
				if (t) await t.rollback();
				const result = errorHandler(payment_fail);
				return res.json(result);
			}

			const result = successHandler(payment_success);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = ServiceController;
