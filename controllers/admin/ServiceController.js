const _ = require("lodash");
const Validate = require("../../config/validate");
const Service = require("../../models/service");
const Ticket = require("../../models/ticket");
const ServiceDetails = require("../../models/serviceDetails");
const Passenger = require("../../models/passenger");
const Cargo = require("../../models/cargo");
const PayDetails = require("../../models/payDetails");
const Driver = require("../../models/driver");
const Route = require("../../models/route");
const Users = require("../../models/user");
const City = require("../../models/city");
const {errorHandler, successHandler} = require("../../utils/responseHandlers");
const {subQueryPaging} = require("../../config/pagination");
const moment = require('moment');
const Promise = require('bluebird');

const {
	service_create, service_update, service_delete, service_has_ticket, ticket_create, ticket_update, ticket_delete,
	available_count_error, driver_exist_err, nothing_updated, route_exist_err, user_exist_err, service_exist_err,
	ticketDetail_delete, timeout_exp, partner_delete, driver_delete, nothing_deleted,
} = require("../../utils/resMessage");

let pageSize = 15;

class ServiceController {

	static async getServices(req, res, next) {
		try {
			const {
				id, toStartDate, fromStartDate, state, type, availableCount,
				ticketPriceRange, ticket, user, route, sort = 1, page = 1
			} = req.query;
			await Validate(req.query, {
				id: 'integer|min:0',
				toStartDate: 'iso8601',
				fromStartDate: 'iso8601',
				state: 'integer|min:0',
				type: 'integer|min:0',
				availableCount: 'integer|min:0',
				ticketPriceRange: 'array|length:2',
				'ticketPriceRange.*': 'integer|min:0',
				ticket: 'string',
				user: 'integer|min:0',
				route: 'integer|min:0',
				sort: 'integer|min:0',
				page: 'required|integer|min:0',
			})
			const maxPrice = await ServiceDetails.max('price');

			let filter = {};
			if (id){
				filter.id = id;
			}
			if (fromStartDate || toStartDate){
				filter.startDate = {
					$gte: fromStartDate ? new Date(moment(fromStartDate).format('YYYY-MM-DD 00:00:00')) : 0,
					$lte: toStartDate ? new Date(moment(toStartDate).format('YYYY-MM-DD 23:59:59')) : new Date(),
				};
			}
			if (state){
				filter.state = state;
			}
			if (route){
				filter.routeId = route;
			}
			if (type){
				filter['$details.type$'] = type;
			}
			if (availableCount){
				filter['$details.availableCount$'] = availableCount;
			}
			if (ticketPriceRange){
				filter['$details.price$'] = {$between: [ticketPriceRange[0] || 0, ticketPriceRange[1] || maxPrice]}
			}
			if (ticket){
				filter['$serviceTickets.id$'] = ticket
			}
			if (user){
				filter['$serviceTickets.userId$'] = user
			}

			await Service.findAndCountAll({
				where: [filter],
				include: [{
					model: ServiceDetails,
					as: 'details',
					required: false,
				}, {
					model: Ticket,
					as: 'serviceTickets',
					required: false,
				}, {
					model: Route,
					as: 'route',
					required: false,
					include: [{
						model: City,
						as: 'routesTo',
						required: false,
					}, {
						model: City,
						as: 'routesFrom',
						required: false,
					}],
				}],
				order: [
					+sort === 1 ? ['startDate', 'ASC'] : ['createdAt', 'ASC'],
				],
				subQuery: false,
				distinct: true,
			}).then(async (data) => {
				const result = subQueryPaging(data, page, pageSize);
				const service = successHandler('ok', result || []);
				return res.json(service);
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
			await Validate(req.query, {id: 'required|integer|min:0'})

			let filter = {};
			if (id){
				filter.id = id;
			}

			const result = await Service.findOne({
				where: [filter],
				include: [{
					model: ServiceDetails,
					as: 'details',
					required: false,
				}, {
					model: Ticket,
					as: 'serviceTickets',
					required: false,
				}, {
					model: Driver,
					as: 'driversAvailable',
					required: false,
					include: [{
						model: Users,
						as: 'driverUser',
						required: false,
						attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
					}],
				}, {
					model: Driver,
					as: 'driverService',
					required: false,
					include: [{
						model: Users,
						as: 'driverUser',
						required: false,
						attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
					}],
				}, {
					model: Route,
					as: 'route',
					required: false,
					include: [{
						model: City,
						as: 'routesTo',
						required: false,
					}, {
						model: City,
						as: 'routesFrom',
						required: false,
					}],
				}],
				distinct: true,
			})

			const service = successHandler('ok', result || {})
			return res.json(service);
		} catch (e) {
			next(e);
		}
	}

	static async getTickets(req, res, next) {
		try {
			const {
				id, toStartDate, fromStartDate, status, user, page = 1
			} = req.query;
			await Validate(req.query, {
				id: 'integer|min:0',
				toStartDate: 'iso8601',
				fromStartDate: 'iso8601',
				status: 'integer|min:0',
				user: 'integer|min:0',
				page: 'required|integer|min:0',
			})

			let filter = {};
			if (id){
				filter.id = id;
			}
			if (fromStartDate || toStartDate){
				filter['$ticketService.startDate$'] = {
					$gte: fromStartDate ? new Date(moment(fromStartDate).format('YYYY-MM-DD 00:00:00')) : 0,
					$lte: toStartDate ? new Date(moment(toStartDate).format('YYYY-MM-DD 23:59:59')) : new Date(),
				};
			}
			if (status){
				filter.status = status;
			}
			if (user){
				filter.userId = user;
			}

			await Ticket.findAndCountAll({
				where: [filter],
				include: [{
					model: Service,
					as: 'ticketService',
					required: false,
				}, {
					model: ServiceDetails,
					as: 'serviceTicket',
					required: false,
				}, {
					model: Cargo,
					as: 'detailsCargo',
					required: false,
					include: [{
						model: City,
						as: 'cargoFromLocation',
						required: false,
					}, {
						model: City,
						as: 'cargoToLocation',
						required: false,
					}],
				}, {
					model: Passenger,
					as: 'detailsPassenger',
					required: false,
					include: [{
						model: City,
						as: 'fromLocation',
						required: false,
					}, {
						model: City,
						as: 'toLocation',
						required: false,
					}],
				}, {
					model: Users,
					as: 'ticketUser',
					required: false,
					attributes: ['id', 'username', 'firstName', 'lastName'],
				}, {
					model: PayDetails,
					as: 'detailsPay',
					required: false,
					attributes: ['id', 'method'],
				}],
				subQuery: false,
				distinct: true,
			}).then(async (data) => {
				const result = subQueryPaging(data, page, pageSize);
				const ticket = successHandler('ok', result || [])
				return res.json(ticket);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getTicket(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			})

			let filter = {};
			if (id){
				filter.id = id;
			}

			const result = await Ticket.findOne({
				where: [filter],
				include: [{
					model: Service,
					as: 'ticketService',
					required: false,
				}, {
					model: ServiceDetails,
					as: 'serviceTicket',
					required: false,
				}, {
					model: Cargo,
					as: 'detailsCargo',
					required: false,
					include: [{
						model: City,
						as: 'cargoFromLocation',
						required: false,
					}, {
						model: City,
						as: 'cargoToLocation',
						required: false,
					}],
				}, {
					model: Passenger,
					as: 'detailsPassenger',
					required: false,
					include: [{
						model: City,
						as: 'fromLocation',
						required: false,
					}, {
						model: City,
						as: 'toLocation',
						required: false,
					}],
				}, {
					model: Users,
					as: 'ticketUser',
					required: false,
					attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
				}, {
					model: PayDetails,
					as: 'detailsPay',
					required: false,
					attributes: ['id', 'method'],
				}],
				distinct: true,
			})

			const ticket = successHandler('ok', result || [])
			return res.json(ticket);
		} catch (e) {
			next(e);
		}
	}

	static async createService(req, res, next) {
		try {
			const {
				startDate, state, availableDrivers, driver, driverMinimumSalary, route, paidSalary, details,
			} = req.body;
			await Validate(req.body, {
				startDate: 'required|iso8601',
				state: 'string|alphaDash',
				availableDrivers: 'required|array',
				'availableDrivers.*': 'required|integer|min:0',
				driver: 'integer|alphaDash|min:0',
				driverMinimumSalary: 'required|integer|min:0',
				route: 'required|integer|alphaDash|min:0',
				paidSalary: 'required|integer|min:0',
				details: 'array',
				'details.*.type': 'integer|min:1|max:2',
				'details.*.maxCount': 'integer|min:0',
				'details.*.availableCount': 'integer|min:0',
				'details.*.price': 'integer|min:0',
			})

			if (!_.isEmpty(availableDrivers)){
				const errors = [];
				await Promise.map(availableDrivers, async (v) => {
					const exist = await Driver.findByPk(v);
					if (_.isEmpty(exist)){
						errors.push(v)
					}
				})
				if (!_.isEmpty(errors)){
					const error = errorHandler(driver_exist_err, errors);
					return res.status(422).json(error);
				}
			}

			if (driver){
				const exist = await Driver.findByPk(driver);
				if (_.isEmpty(exist)){
					const error = errorHandler(driver_exist_err);
					return res.status(422).json(error);
				}
			}

			if (route){
				const exist = await Route.findByPk(route);
				if (_.isEmpty(exist)){
					const error = errorHandler(route_exist_err);
					return res.status(422).json(error);
				}
			}

			const service = await Service.create({
				startDate: startDate ? startDate : null,
				state: state ? state : 1,
				driverMinimumSalary: driverMinimumSalary ? +driverMinimumSalary : null,
				routeId: route ? +route : null,
				paidSalary: paidSalary ? +paidSalary : null,
			})
			let newDetails;
			if (!_.isEmpty(details) && details.length <= 2 && service.id){
				newDetails = await Promise.map(details, async (v) => {
					return await ServiceDetails.create({
						serviceId: service.id,
						type: v.type ? +v.type : null,
						maxCount: v.maxCount ? +v.maxCount : null,
						availableCount: v.availableCount ? +v.availableCount : null,
						price: v.price ? +v.price : null,
					})
				})
			}

			if (!_.isEmpty(availableDrivers) && service.id){
				await Promise.map(availableDrivers, async (v) => {
					await Driver.update({
						availableDrivers: service.id,
					}, {
						where: {id: v}
					});
				})
			}
			if (driver && service.id){
				await Driver.update({driver: service.id},
					{where: {id: driver}});
			}

			const result = successHandler(service_create, {service, newDetails} || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async createTicket(req, res, next) {
		try {
			const {
				promoCode, service, serviceType, user, details, method, price, orderId, status,
			} = req.body;
			await Validate(req.body, {
				service: 'integer|required|min:0',
				serviceType: 'integer|required|min:0',
				promoCode: 'string|alphaDash',
				user: 'integer|required|min:0',
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
				method: 'required|string|alphaDash',
				price: 'required|integer|min:0',
				status: 'integer|min:0',
				orderId: 'alphaDash',
			}, {
				passengerPhoneNumber: details && details[0] && details[0].passengerPhoneNumber ? details[0].passengerPhoneNumber : '',
				senderPhoneNumber: details && details[0] && details[0].senderPhoneNumber ? details[0].senderPhoneNumber : '',
				receiverPhoneNumber: details && details[0] && details[0].receiverPhoneNumber ? details[0].receiverPhoneNumber : '',
			})

			const exist = await Users.findByPk(user);
			if (_.isEmpty(exist)){
				const error = errorHandler(user_exist_err);
				return res.json(error);
			}

			const serviceId = await Service.findOne({
				where: {id: service},
				include: [{
					model: ServiceDetails,
					as: 'details',
					required: false,
				}]
			});
			if (_.isEmpty(serviceId)){
				const error = errorHandler(service_exist_err);
				return res.json(error);
			}

			const detail = _.find(serviceId.details ? serviceId.details : [],
				{'type': typeof serviceType === "string" ? serviceType : serviceType.toString()});
			if (detail && +detail.availableCount === 0){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}
			if (+serviceType === 1 && details && +details.length > +detail.availableCount){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}
			if (+serviceType === 2 && _.get(details, 0) && _.get(details, 0).kg && _.get(details, 0).kg > +detail.availableCount){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}

			const ticket = await Ticket.create({
				promoCode, status: status ? +status : 1, serviceId: service ? +service : null, userId: user ? +user : null,
				serviceDetailsId: detail ? +detail.id : null,
			});

			if (!_.isEmpty(ticket)){
				if (detail && +serviceType === 1){
					if (!_.isEmpty(details)){
						await Promise.map(details, async (d) => {
							await Passenger.create({
								state: d.state, fromAddress: d.fromAddress, toAddress: d.toAddress,
								passengerSeat: d.passengerSeat || null, isChildPassenger: d.isChildPassenger,
								passengerPhoneNumber: d.passengerPhoneNumber ? d.passengerPhoneNumber : null,
								fromCity: d.fromCity || null, toCity: d.toCity || null, ticketId: ticket.id,
							});
							await ServiceDetails.update({
								availableCount: +detail.availableCount - 1
							}, {where: {id: detail.id}});
						})
					}
				}

				if (detail && +serviceType === 2){
					let cargo;
					if (!_.isEmpty(details)){
						await Promise.map(details, async (d) => {
							cargo = await Cargo.create({
								state: d.state, fromAddress: d.fromAddress, toAddress: d.toAddress, kg: +d.kg || null,
								description: d.description, fromCity: d.fromCity || null, toCity: d.toCity || null,
								senderPhoneNumber: d.senderPhoneNumber ? d.senderPhoneNumber : null,
								receiverPhoneNumber: d.receiverPhoneNumber ? d.receiverPhoneNumber : null,
								ticketId: ticket.id,
							});
						})

					}
					if (cargo && cargo.kg && +cargo.kg <= +detail.availableCount){
						await ServiceDetails.update({
							availableCount: +detail.availableCount - +cargo.kg
						}, {where: {id: detail.id}});
					}
				}

				await PayDetails.create({
					method, price: price ? price : null, orderId, ticketId: +ticket.id
				});
			}

			const result = successHandler(ticket_create, ticket || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateService(req, res, next) {
		try {
			const {
				id, startDate, state, availableDrivers, driver, routeId: route,
				driverMinimumSalary, paidSalary, details, deleteDetailId, delAvailableDriverId
			} = req.body;
			await Validate(req.body, {
				id: 'requiredWithout:delAvailableDriverId|integer|min:0',
				startDate: 'iso8601',
				state: 'string|alphaDash',
				availableDrivers: 'array',
				'availableDrivers.*': 'integer|min:0',
				driver: 'integer|alphaDash|min:0',
				route: 'integer|alphaDash|min:0',
				driverMinimumSalary: 'integer|min:0',
				paidSalary: 'integer|min:0',
				deleteDetailId: 'integer|min:0',
				details: 'array',
				'details.*.type': 'integer|min:1|max:2',
				'details.*.maxCount': 'integer|min:0',
				'details.*.availableCount': 'integer|min:0',
				'details.*.price': 'integer|min:0',
				delAvailableDriverId: 'integer|min:0',
			})

			let update = {};
			if (startDate){
				update.startDate = startDate
			}
			if (state){
				update.state = state
			}
			if (route){
				const exist = await Route.findByPk(route);
				if (_.isEmpty(exist)){
					const error = errorHandler(route_exist_err);
					return res.status(422).json(error);
				}
				update.routeId = route
			}
			if (driverMinimumSalary){
				update.driverMinimumSalary = driverMinimumSalary
			}
			if (paidSalary){
				update.paidSalary = paidSalary
			}

			if (delAvailableDriverId){
				const deleted = await Driver.update({availableDrivers: null}, {where: {id: delAvailableDriverId}});
				const result = deleted === [0] ? errorHandler(driver_exist_err, delAvailableDriverId)
					: successHandler(driver_delete, deleted || []);
				return res.json(result);
			}

			if (!_.isEmpty(availableDrivers)){
				const errors = [];
				await Promise.map(availableDrivers, async (v) => {
					const exist = await Driver.findByPk(v);
					if (_.isEmpty(exist)){
						errors.push(v)
					}
				})
				if (!_.isEmpty(errors)){
					const error = errorHandler(driver_exist_err, errors);
					return res.status(422).json(error);
				}
			}

			if (driver){
				const exist = await Driver.findByPk(driver);
				if (_.isEmpty(exist)){
					const error = errorHandler(driver_exist_err);
					return res.status(422).json(error);
				}
			}

			const service = await Service.update({...update}, {where: {id}});

			let deleteDetail;
			if (deleteDetailId){
				const exist = await ServiceDetails.findByPk(deleteDetailId);
				if (!_.isEmpty(exist)){
					deleteDetail = await ServiceDetails.destroy({
						where: {id: deleteDetailId},
						limit: 1
					});
				}
			}
			let newDetails;
			if (!_.isEmpty(details)){
				const detailsLength = await ServiceDetails.findAll({where: {serviceId: id}})
				newDetails = await Promise.map(details, async (v) => {
					if (v.id){
						return await ServiceDetails.update({
							type: v.type ? +v.type : null,
							maxCount: v.maxCount ? +v.maxCount : null,
							availableCount: v.availableCount ? +v.availableCount : null,
							price: v.price ? +v.price : null,
						}, {where: {id: v.id}})
					} else{
						if (+details.length <= 2 && +detailsLength.length < 2){
							return await ServiceDetails.create({
								serviceId: id,
								type: v.type ? +v.type : null,
								maxCount: v.maxCount ? +v.maxCount : null,
								availableCount: v.availableCount ? +v.availableCount : null,
								price: v.price ? +v.price : null,
							})
						}
					}
				})
			}

			let av, d;
			if (!_.isEmpty(availableDrivers) && id){
				av = await Promise.map(availableDrivers, async (v) => {
					return await Driver.update({
						availableDrivers: id,
					}, {
						where: {id: v}
					});
				})
			}
			if (driver && id){
				d = await Driver.update({driver: id},
					{where: {id: driver}});
			}

			const result = deleteDetail === 1 || service === [1] || !_.isEmpty(newDetails) || !_.isEmpty(av) || d === [1] ?
				successHandler(service_update, {deleteDetail, service, newDetails, availableDrivers: av, driver: d}) :
				errorHandler(nothing_updated);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateTicket(req, res, next) {
		try {
			const {
				id, status, promoCode, user, method, serviceType, details
			} = req.body;
			await Validate(req.body, {
				id: 'required|integer|min:0',
				status: 'integer|min:0',
				promoCode: 'string|alphaDash',
				user: 'integer|min:0',
				method: 'string|alphaDash',
				serviceType: 'integer|requiredWith:details|min:0',
				details: 'array',
				'details.*.id': 'integer|min:0',
				'details.*.isChildPassenger': 'boolean',
				'details.*.state': 'integer|min:0',
				'details.*.fromCity': 'array|latLong|length:2',
				'details.*.toCity': 'array|latLong|length:2',
				'details.*.fromAddress': 'string|regex:[a-zA-Z0-9 ]$',
				'details.*.toAddress': 'string|regex:[a-zA-Z0-9 ]$',
				'details.*.passengerPhoneNumber': 'string|minLength:9|phoneNumber',
				'details.*.passengerSeat': 'integer|min:0',
				'details.*.kg': 'integer|min:0',
				'details.*.description': 'string|regex:[a-zA-Z0-9 ]$',
				'details.*.senderPhoneNumber': 'string|minLength:9|phoneNumber',
				'details.*.receiverPhoneNumber': 'string|minLength:9|phoneNumber',
			}, {
				passengerPhoneNumber: details && details[0] && details[0].passengerPhoneNumber ? details[0].passengerPhoneNumber : '',
				senderPhoneNumber: details && details[0] && details[0].senderPhoneNumber ? details[0].senderPhoneNumber : '',
				receiverPhoneNumber: details && details[0] && details[0].receiverPhoneNumber ? details[0].receiverPhoneNumber : '',
			})

			let update = {};
			if (promoCode){
				update.promoCode = promoCode
			}
			if (user){
				const exist = await Users.findByPk(user);
				if (_.isEmpty(exist)){
					const error = errorHandler(user_exist_err);
					return res.json(error);
				} else{
					update.userId = user;
				}
			}

			const serviceId = await Service.findOne({
				where: {id},
				include: [{
					model: ServiceDetails,
					as: 'details',
					required: false,
				}]
			});
			if (_.isEmpty(serviceId)){
				const error = errorHandler(service_exist_err);
				return res.json(error);
			}

			const detail = _.find(serviceId.details ? serviceId.details : [],
				{'type': typeof serviceType === "string" ? serviceType : serviceType.toString()});
			if (detail && detail.availableCount && +detail.availableCount === 0){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}
			if (+serviceType === 1 && details && detail && detail.availableCount && +details.length > +detail.availableCount){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}
			if (+serviceType === 2 && _.get(details, 0) && _.get(details, 0).kg && detail
				&& detail.availableCount && _.get(details, 0).kg > +detail.availableCount){
				const error = errorHandler(available_count_error, +detail.availableCount);
				return res.json(error);
			}

			const allDetails = await Ticket.findOne({
				where: {id},
				include: [{
					model: Service,
					as: 'ticketService',
					required: false,
				}, {
					model: ServiceDetails,
					as: 'serviceTicket',
					required: false,
				}, {
					model: Cargo,
					as: 'detailsCargo',
					required: false,
				}, {
					model: Passenger,
					as: 'detailsPassenger',
					required: false,
				}, {
					model: PayDetails,
					as: 'detailsPay',
					required: false,
				}]
			});

			let ticket, ticketDetails, m;
			if (allDetails && allDetails.ticketService){
				if (status){
					if ((new Date(allDetails.ticketService.startDate).getHours() - new Date().getHours()) > allDetails.ticketService.waitTimeMin){
						ticket = await Ticket.update({status}, {where: {id}});
					} else{
						const error = errorHandler(timeout_exp, allDetails.ticketService.waitTimeMin);
						return res.json(error);
					}
				}
				ticket = await Ticket.update({...update}, {where: {id}});

				if (allDetails.serviceTicket){
					if (ticket && ticket[0] === 1 && +status === 3){
						const count = +allDetails.serviceTicket.availableCount + 1;
						await ServiceDetails.update({
								availableCount: count <= +allDetails.serviceTicket.maxCount
									? count : +allDetails.serviceTicket.maxCount
							},
							{where: {id: allDetails.serviceTicket.id}})
					}

					if (+serviceType === 1 && !_.isEmpty(details)){
						await Promise.map(details, async (d) => {
							const passenger = await Passenger.findByPk(d.id);
							if (_.isEmpty(passenger)){
								ticketDetails = await Passenger.create({
									state: d.state ? d.state : 1, fromAddress: d.fromAddress, toAddress: d.toAddress,
									passengerSeat: d.passengerSeat || null, isChildPassenger: d.isChildPassenger,
									passengerPhoneNumber: d.passengerPhoneNumber ? d.passengerPhoneNumber : null,
									fromCity: d.fromCity || null, toCity: d.toCity || null, ticketId: id,
								});
								await ServiceDetails.update({
									availableCount: +allDetails.serviceTicket.availableCount - 1
								}, {where: {id: allDetails.serviceTicket.id}});
							} else{
								let passUpdate = {};
								if (d.state){
									passUpdate.state = d.state
								}
								if (d.fromAddress){
									passUpdate.fromAddress = d.fromAddress
								}
								if (d.toAddress){
									passUpdate.toAddress = d.toAddress
								}
								if (d.passengerSeat){
									passUpdate.passengerSeat = d.passengerSeat
								}
								if (d.isChildPassenger){
									passUpdate.isChildPassenger = d.isChildPassenger
								}
								if (d.passengerPhoneNumber){
									passUpdate.passengerPhoneNumber = d.passengerPhoneNumber
								}
								if (d.fromCity){
									passUpdate.fromCity = d.fromCity
								}
								if (d.toCity){
									passUpdate.toCity = d.toCity
								}
								ticketDetails = await Passenger.update({...passUpdate},
									{where: {id: d.id}});
								if (ticketDetails && ticketDetails[0] === 1 && d.state && +d.state === 3){
									const count = +allDetails.serviceTicket.availableCount + 1
									await ServiceDetails.update({
											availableCount: count <= +allDetails.serviceTicket.maxCount
												? count : +allDetails.serviceTicket.maxCount
										},
										{where: {id: allDetails.serviceTicket.id}})
								}
							}
						})
					}
					if (+serviceType === 2 && !_.isEmpty(details)){
						await Promise.map(details, async (d) => {
							const cargo = await Cargo.findByPk(d.id);
							if (_.isEmpty(cargo)){
								ticketDetails = await Cargo.create({
									state: d.state ? d.state : 1, fromAddress: d.fromAddress, toAddress: d.toAddress,
									kg: +d.kg || null, description: d.description, fromCity: d.fromCity || null,
									senderPhoneNumber: d.senderPhoneNumber ? d.senderPhoneNumber : null,
									receiverPhoneNumber: d.receiverPhoneNumber ? d.receiverPhoneNumber : null,
									toCity: d.toCity || null, ticketId: id,
								});
								if (d.kg && +d.kg <= +allDetails.serviceTicket.availableCount){
									await ServiceDetails.update({
										availableCount: +allDetails.serviceTicket.availableCount - +d.kg
									}, {where: {id: allDetails.serviceTicket.id}});
								}
							} else{
								let cargoUpdate = {};
								if (d.state){
									cargoUpdate.state = d.state
								}
								if (d.fromAddress){
									cargoUpdate.fromAddress = d.fromAddress
								}
								if (d.toAddress){
									cargoUpdate.toAddress = d.toAddress
								}
								if (d.kg){
									cargoUpdate.kg = d.kg
								}
								if (d.description){
									cargoUpdate.description = d.description
								}
								if (d.senderPhoneNumber){
									cargoUpdate.senderPhoneNumber = d.senderPhoneNumber
								}
								if (d.receiverPhoneNumber){
									cargoUpdate.receiverPhoneNumber = d.receiverPhoneNumber
								}
								if (d.fromCity){
									cargoUpdate.fromCity = d.fromCity
								}
								if (d.toCity){
									cargoUpdate.toCity = d.toCity
								}
								ticketDetails = await Cargo.update({...cargoUpdate},
									{where: {id: d.id}});
								if (ticketDetails && ticketDetails[0] === 1 && d.state && +d.state === 3
									&& allDetails.detailsCargo){
									const count = +allDetails.serviceTicket.availableCount + +allDetails.detailsCargo[0].kg
									await ServiceDetails.update({
											availableCount: count <= +allDetails.serviceTicket.maxCount
												? count : +allDetails.serviceTicket.maxCount
										},
										{where: {id: allDetails.serviceTicket.id}})
								}
							}
						})
					}
				}

				if (method){
					if (_.isEmpty(allDetails.detailsPay)){
						m = await PayDetails.create({method, ticketId: id});
					} else{
						m = await PayDetails.update({method}, {
							where: {id: allDetails.detailsPay.id}
						});
					}
				}
			}

			const result = ticket && ticket[0] === 1 || ticketDetails && ticketDetails[0] === 1
			|| !_.isEmpty(ticketDetails) || m && m[0] === 1 ? successHandler(ticket_update, {ticket, ticketDetails, m}) :
				errorHandler(nothing_updated);
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

			const ticket = await Ticket.findAll({
				where: {serviceId: id},
			});

			if (!_.isEmpty(ticket)){
				const error = errorHandler(service_has_ticket, ticket);
				return res.json(error);
			}

			const service = await Service.destroy({
				where: {id},
				limit: 1
			});

			const result = service === 0 ? errorHandler(nothing_deleted) : successHandler(service_delete, service)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteTicket(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const ticket = await Ticket.destroy({
				where: {id},
				limit: 1
			});

			const result = ticket === 0 ? errorHandler(nothing_deleted) : successHandler(ticket_delete, ticket)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteTicketDetail(req, res, next) {
		try {
			const {id} = req.params;
			const {detailsId, type} = req.query;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})
			await Validate(req.query, {
				detailsId: 'required|integer|min:0',
				type: 'required|alphaDash',
			})

			if (detailsId){
				const sd = await ServiceDetails.findByPk(detailsId);
				const d = {};
				if (!_.isEmpty(sd) && +type === 1){
					d.availableCount = +sd.availableCount + 1;
				}
				if (!_.isEmpty(sd) && +type === 2){
					const cargo = await Cargo.findByPk(id)
					d.availableCount = +sd.availableCount + +cargo.kg;
				}
				await ServiceDetails.update({...d}, {
					where: {id: detailsId},
					limit: 1
				});
			}

			let ticketDetail;
			if (+type === 1){
				ticketDetail = await Passenger.destroy({
					where: {id},
					limit: 1
				});
			}
			if (+type === 2){
				ticketDetail = await Cargo.destroy({
					where: {id},
					limit: 1
				});
			}

			const result = ticketDetail === 0 ? errorHandler(nothing_deleted) : successHandler(ticketDetail_delete, ticketDetail)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = ServiceController;
