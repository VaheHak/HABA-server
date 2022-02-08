const _ = require("lodash");
const jwt = require("jsonwebtoken");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const {
	login_error,
	digit_code_error,
	login,
	digit_code_send_err,
	login_check_error,
	user_exist_error,
	user_not_verified,
	check_forgot,
	forgot_checked,
	password_changed,
	delivery_service_up_status_err,
	delivery_service_status,
	delivery_service_not_found,
	error_message_phoneNumber,
	error_message_password,
	error_message_endDate,
	error_message_startDate,
	error_message_page,
	error_message_code,
	error_message_id,
	error_message_status,
	error_message_coords,
	driver_exist_error,
	nothing_updated,
	driver_update,
	error_message_osType,
	error_message_deviceToken,
	error_message_deviceId,
	device_exist_error,
	device_create, nothing_deleted, device_delete,
} = require("../../utils/resMessage");
const Validate = require("../../config/validate");
const Users = require("../../models/user");
const {sendVerifyCode, checkVerifyCode} = require("../../config/smsVerify");
const DeliveryService = require("../../models/deliveryService");
const {getPagination, getPagingData} = require("../../config/pagination");
const Partner = require("../../models/partner");
const PartnerBranch = require("../../models/partnerBranch");
const Driver = require("../../models/driver");
const DriverState = require("../../models/driverState");
const Car = require("../../models/car");
const Socket = require("../../config/Socket");
const Device = require("../../models/device");
const Roles = require("../../models/roles");

const {JWT_SECRET, JWT_REFRESH_SECRET} = process.env;
const pageSize = 15;

class DriverController {
	static async getProfile(req, res, next) {
		try {
			let filter = {};
			if (req.userId){
				filter.id = req.userId
			}
			const user = await Users.findOne({
				where: filter,
				include: [{
					model: Roles, as: 'roles', required: false,
				}],
				attributes: {exclude: ['password', 'refreshToken']},
			});

			const myAccount = successHandler('ok', user);
			res.json(myAccount);
		} catch (e) {
			next(e);
		}
	}

	static async driverLogin(req, res, next) {
		try {
			const {phoneNumber, password} = req.body;
			const errors = await Validate(req.body, {
				phoneNumber: 'string|required|minLength:9', password: 'required|minLength:8|maxLength:20',
			}, {phoneNumber}, true, void 0, {
				phoneNumber: error_message_phoneNumber, password: error_message_password,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0},
				attributes: {exclude: ['refreshToken']},
			});

			if (!user || +user.role !== 3){
				const error = errorHandler(user_exist_error);
				return res.status(200).json(error);
			}

			if (!user || user.getDataValue('password') !== Users.passwordHash(password)){
				const error = errorHandler(login_error);
				return res.status(200).json(error);
			}

			let accessToken, refreshToken;
			if (!_.isEmpty(user)){
				accessToken = jwt.sign({userId: user.id, role: user.role}, JWT_SECRET, {expiresIn: '1h'});
				refreshToken = jwt.sign({userId: user.id, role: user.role}, JWT_REFRESH_SECRET, {expiresIn: '7d'});
				await Users.update({checked: true, refreshToken}, {
					where: {id: user.id}
				});
			}

			const result = successHandler(login, {tokens: {accessToken, refreshToken}, user: user});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async forgotPassword(req, res, next) {
		try {
			const {phoneNumber} = req.body;
			const errors = await Validate(req.body, {
				phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber}, true, void 0, {phoneNumber: error_message_phoneNumber})
			if (errors){
				return res.status(200).json(errors);
			}

			let exist;
			if (phoneNumber){
				exist = await Users.findOne({where: {phoneNumber}});
				if (!exist || +exist.role !== 3){
					const error = errorHandler(user_exist_error)
					return res.status(200).json(error);
				}
				if (exist && exist.verified !== true){
					const error = errorHandler(user_not_verified)
					return res.status(200).json(error);
				}
			}

			const verifyStatus = await sendVerifyCode(phoneNumber);

			let result;
			if (verifyStatus && verifyStatus.status === "pending" && exist){
				await Users.update({verifyId: verifyStatus.sid}, {
					where: {id: exist.id}
				});
				result = successHandler(check_forgot, verifyStatus)
			} else{
				result = errorHandler(digit_code_send_err)
			}

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async forgotCheckCode(req, res, next) {
		try {
			const {phoneNumber, code} = req.body;
			const errors = await Validate(req.body, {
				code: 'integer|required|minLength:4|maxLength:4|min:0', phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber}, true, void 0, {
				phoneNumber: error_message_phoneNumber, code: error_message_code,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

			if (!user || +user.role !== 3){
				const error = errorHandler(user_exist_error);
				return res.status(200).json(error);
			}

			const verifyStatus = await checkVerifyCode(phoneNumber, code);

			if (!verifyStatus || verifyStatus.status && verifyStatus.status !== "approved"){
				const error = errorHandler(digit_code_error);
				return res.status(200).json(error);
			}

			if (!_.isEmpty(user)){
				await Users.update({verified: true}, {
					where: {id: user.id}
				});
			}

			const result = successHandler(forgot_checked)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async forgotResetPassword(req, res, next) {
		try {
			const {phoneNumber, code, password} = req.body;
			const errors = await Validate(req.body, {
				password: 'required|minLength:8|maxLength:20',
				code: 'integer|required|minLength:4|maxLength:4|min:0',
				phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber}, true, void 0, {
				phoneNumber: error_message_phoneNumber, code: error_message_code, password: error_message_password,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

			if (user && +user.role !== 3){
				const error = errorHandler(user_exist_error);
				return res.status(200).json(error);
			}
			if (!user){
				const error = errorHandler(login_check_error);
				return res.status(200).json(error);
			}
			if (user && user.verified !== true){
				const error = errorHandler(user_not_verified);
				return res.status(200).json(error);
			}

			const verifyStatus = await checkVerifyCode(phoneNumber, code);

			if (!verifyStatus || verifyStatus.status && verifyStatus.status !== "approved"){
				const error = errorHandler(digit_code_error);
				return res.status(200).json(error);
			}

			if (!_.isEmpty(user)){
				await Users.update({password}, {where: {id: user.id}});
			}

			const result = successHandler(password_changed)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async postDevice(req, res, next) {
		try {
			const {osType, deviceToken, deviceId} = req.body;
			const errors = await Validate(req.body, {
				osType: 'required|integer|min:1|max:2',
				deviceToken: 'string|required|regex:[a-zA-Z0-9 ]$|minLength:10|maxLength:165',
				deviceId: 'string|required|regex:[a-zA-Z0-9 ]$|minLength:10|maxLength:64',
			}, void 0, true, void 0, {
				osType: error_message_osType, deviceToken: error_message_deviceToken, deviceId: error_message_deviceId,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			const device = await Device.findOne({
				where: {deviceToken}
			});

			if (device){
				const error = errorHandler(device_exist_error);
				return res.status(200).json(error);
			}

			await Device.create({osType, deviceToken, deviceId, userId: req.userId ? req.userId : null});

			const result = successHandler(device_create)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async getDeliveryOrders(req, res, next) {
		try {
			const {page = 1, startDate, endDate} = req.body;
			const errors = await Validate(req.body, {
				page: 'integer|min:0', endDate: 'iso8601', startDate: 'iso8601',
			}, void 0, true, void 0, {
				page: error_message_page, startDate: error_message_startDate, endDate: error_message_endDate,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			let filter = {};
			if (startDate || endDate){
				filter.createdAt = {
					$gte: startDate ? new Date(startDate) : 0, $lte: endDate ? new Date(endDate) : new Date(),
				};
			}

			const {limit, offset} = getPagination(page, pageSize);

			const driver = await Driver.findOne({userId: req.userId});

			await DeliveryService.findAndCountAll({
				where: [filter, {driverId: driver.id}], include: [{
					model: Users, as: 'deliveryServiceUser', required: false,
				}, {
					model: Partner, as: 'deliveryServicePartner', required: false,
				}, {
					model: PartnerBranch, as: 'deliveryServicePartnerBranch', required: false,
				}, {
					model: Driver, as: 'deliveryServiceDriver', required: false, include: [{
						model: DriverState, as: 'stateDriver', required: false,
					}, {
						model: Car, as: 'driverCars', required: false,
					}]
				}], offset: offset, limit: limit, distinct: true,
			}).then((data) => {
				const result = getPagingData(data, page, limit);
				const deliveryService = successHandler('ok', result || [])
				return res.json(deliveryService);
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
				return res.status(200).json(errors);
			}

			let filter = {};
			if (id){
				filter.id = id;
			}
			const driver = await Driver.findOne({userId: req.userId});

			const deliveryService = await DeliveryService.findOne({
				where: [filter, {driverId: driver.id}], include: [{
					model: Users, as: 'deliveryServiceUser', required: false,
				}, {
					model: Partner, as: 'deliveryServicePartner', required: false,
				}, {
					model: PartnerBranch, as: 'deliveryServicePartnerBranch', required: false,
				}, {
					model: Driver, as: 'deliveryServiceDriver', required: false, include: [{
						model: DriverState, as: 'stateDriver', required: false,
					}, {
						model: Car, as: 'driverCars', required: false,
					}]
				}], distinct: true,
			})

			const result = successHandler('ok', deliveryService || {})
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateDeliveryOrderStatus(req, res, next) {
		try {
			const {deliveryOrderId, status} = req.body;
			const errors = await Validate(req.body, {
				status: 'integer|required|min:1|max:3', deliveryOrderId: 'integer|required|min:0',
			}, void 0, true, void 0, {id: error_message_id, status: error_message_status})
			if (errors){
				return res.status(200).json(errors);
			}

			const deliveryService = await DeliveryService.findByPk(deliveryOrderId);

			if (!deliveryService){
				const error = errorHandler(delivery_service_not_found);
				return res.status(200).json(error);
			}
			if (deliveryService && +status !== 1 && +status - +deliveryService.status !== 1){
				const error = errorHandler(delivery_service_up_status_err);
				return res.status(200).json(error);
			}

			let update = {};
			if (status){
				update.status = status
			}
			if (+status === 1){
				update.pendingDate = new Date();
			}
			if (+status === 2){
				update.tookDate = new Date();
			}
			if (+status === 3){
				update.doneDate = new Date();
			}
			if (!_.isEmpty(deliveryService)){
				await DeliveryService.update({...update}, {where: {id: deliveryOrderId}});
			}

			const result = successHandler(delivery_service_status)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateCoords(req, res, next) {
		try {
			const {id, coords} = req.body;
			const errors = await Validate(req.body, {
				id: 'required|integer|min:0', coords: 'required|array|latLong|length:2',
			}, void 0, true, void 0, {
				id: error_message_id, coords: error_message_coords,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			const driver = await Driver.findByPk(id);
			if (!driver){
				const error = errorHandler(driver_exist_error);
				return res.status(200).json(error);
			}

			const user = await Users.findOne({
				where: {id: driver.userId}
			})
			if (!user){
				const error = errorHandler(user_exist_error);
				return res.status(200).json(error);
			}

			let update = {};
			if (coords){
				update.coords = coords;
			}

			const d = await Driver.update({...update}, {where: {id}});
			Socket.emit('new-coords', {driverId: id, coords});

			const result = +_.get(d, 0) === 1 ? successHandler(driver_update) : errorHandler(nothing_updated)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteDevice(req, res, next) {
		try {
			const {id} = req.body;
			await Validate(req.body, {
				id: 'required|integer|min:0',
			})

			const device = await Device.destroy({
				where: {id}, limit: 1
			});

			const result = device === 0 ? errorHandler(nothing_deleted) : successHandler(device_delete, device)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = DriverController;
