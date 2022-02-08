const _ = require("lodash");
const jwt = require("jsonwebtoken");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const {
	login_error, digit_code_error, login, digit_code_send_err, login_check_error, user_exist_error, user_not_verified,
	check_forgot, forgot_checked, password_changed,
} = require("../../utils/resMessage");
const Validate = require("../../config/validate");
const Users = require("../../models/user");
const {sendVerifyCode, checkVerifyCode} = require("../../config/smsVerify");
const Partner = require("../../models/partner");
const Roles = require("../../models/roles");
const PartnerBranch = require("../../models/partnerBranch");
const Driver = require("../../models/driver");
const Car = require("../../models/car");

const {JWT_SECRET, JWT_REFRESH_SECRET} = process.env;

class PartnerController {

	static async getProfile(req, res, next) {
		try {
			let filter = {};
			if (req.userId){
				filter.id = req.userId
			}
			const user = await Users.findOne({
				where: filter,
				include: [{
					model: Roles,
					as: 'roles',
					required: false,
				}, {
					model: Partner,
					as: 'userPartners',
					required: false,
				}],
				attributes: {exclude: ['password', 'refreshToken', 'restoreVerifyId', 'verified', 'verifyId', 'deleted']},
			});
			const myAccount = successHandler('ok', user);
			res.json(myAccount);
		} catch (e) {
			next(e);
		}
	}

	static async partnerLogin(req, res, next) {
		try {
			const {phoneNumber, password} = req.body;
			await Validate(req.body, {
				password: 'required|minLength:8|maxLength:20',
				phoneNumber: 'string|required|minLength:9',
			}, {phoneNumber})

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0},
			});

			if (!user || +user.role !== 5){
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

			const result = successHandler(login, {accessToken, refreshToken});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async forgotPassword(req, res, next) {
		try {
			const {phoneNumber} = req.body;
			await Validate(req.body, {
				phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber})

			let exist;
			if (phoneNumber){
				exist = await Users.findOne({where: {phoneNumber}});
				if (!exist || +exist.role !== 5){
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
			await Validate(req.body, {
				code: 'integer|required|minLength:4|maxLength:4|min:0',
				phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber})

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

			if (!user || +user.role !== 5){
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
			await Validate(req.body, {
				password: 'required|minLength:8|maxLength:20',
				code: 'integer|required|minLength:4|maxLength:4|min:0',
				phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber})

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

			if (user && +user.role !== 5){
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

	static async getBranches(req, res, next) {
		try {
			const {partnerId} = req.query;
			await Validate(req.query, {
				partnerId: 'required|integer|min:0',
			})

			let filter = {};
			if (partnerId){
				filter.partnerId = partnerId;
			}

			const result = await PartnerBranch.findAll({
				where: [filter],
				include: [{
					model: Driver,
					as: "driverPartnerBranches",
					required: false,
					include: [{
						model: Users,
						as: "driverUser",
						required: false,
					}, {
						model: Car,
						as: 'driverCars',
						required: false,
					}]
				}],
			})

			const partner = successHandler('ok', result || [])
			res.json(partner);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = PartnerController;
