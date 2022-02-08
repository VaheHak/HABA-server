const _ = require("lodash");
const HttpError = require('http-errors');
const jwt = require("jsonwebtoken");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const {
	login_error, digit_code_error, login, phone_exist_error, digit_code_send_err, login_check_error,
	user_exist_error, choose_password, check_registration, registration_checked, user_not_verified, check_forgot,
	forgot_checked, password_changed, error_message_phoneNumber, error_message_password, error_message_code,
	error_message_refreshToken, authenticate_err,
} = require("../../utils/resMessage");
const Validate = require("../../config/validate");
const Users = require("../../models/user");
const {sendVerifyCode, checkVerifyCode} = require("../../config/smsVerify");

const {JWT_SECRET, JWT_REFRESH_SECRET} = process.env;

class UserController {

	static async userLogin(req, res, next) {
		try {
			const {phoneNumber, password} = req.body;
			const errors = await Validate(req.body, {
				password: 'required|minLength:8|maxLength:20',
				phoneNumber: 'string|required|minLength:9',
			}, {phoneNumber}, true, void 0, {
				phoneNumber: error_message_phoneNumber, password: error_message_password,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

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

	static async resetToken(req, res, next) {
		try {
			const errors = await Validate(req.body, {
				refreshToken: 'required|string',
			}, void 0, true, void 0, {refreshToken: error_message_refreshToken})
			if (errors){
				return res.status(200).json(errors);
			}
			const {refreshToken} = req.body;

			const user = await Users.findOne({where: {refreshToken}});

			if (!refreshToken || !user){
				const error = errorHandler(error_message_refreshToken)
				return res.json(error);
			}

			jwt.verify(refreshToken, JWT_REFRESH_SECRET, void 0, async (err, data) => {
				if (!err){
					const user = await Users.findByPk(data.userId);
					if (_.isEmpty(user)){
						const error = errorHandler(authenticate_err);
						return res.status(401).json(error);
					}
					if (user.deleted === true){
						const error = errorHandler(user_exist_error);
						return res.status(401).json(error);
					}

					const accessToken = jwt.sign({userId: data.userId, role: data.role}, JWT_SECRET, {expiresIn: '1h'}, void 0);
					const refToken = jwt.sign({userId: user.id, role: user.role}, JWT_REFRESH_SECRET, {expiresIn: '7d'});
					await Users.update({refreshToken: refToken}, {
						where: {id: user.id}
					});

					const result = successHandler("ok", {accessToken, refreshToken: refToken})
					return res.json(result);
				} else{
					throw HttpError(401, {status: false, errors: authenticate_err, data: null});
				}
			});
		} catch (e) {
			next(e);
		}
	}

	static async userRegister(req, res, next) {
		try {
			const {phoneNumber} = req.body;
			const errors = await Validate(req.body, {
				phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber}, true, void 0, {phoneNumber: error_message_phoneNumber})
			if (errors){
				return res.status(200).json(errors);
			}

			if (phoneNumber){
				const uniquePhone = await Users.findOne({where: {phoneNumber}});
				if (uniquePhone && uniquePhone.verified === true && !uniquePhone.getDataValue('password')){
					const error = errorHandler(choose_password, {password: false})
					return res.status(200).json(error);
				}
				if (uniquePhone){
					const error = errorHandler(phone_exist_error)
					return res.status(200).json(error);
				}
			}

			const user = await Users.create({phoneNumber, role: 4});

			const verifyStatus = await sendVerifyCode(phoneNumber);

			let result;
			if (verifyStatus && verifyStatus.status === "pending" && user){
				await Users.update({verifyId: verifyStatus.sid}, {
					where: {id: user.id}
				});
				result = successHandler(check_registration, verifyStatus)
			} else{
				result = errorHandler(digit_code_send_err)
			}

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async checkRegistration(req, res, next) {
		try {
			const {phoneNumber, code} = req.body;
			const errors = await Validate(req.body, {
				code: 'integer|required|minLength:4|maxLength:4|min:0',
				phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber}, true, void 0, {
				phoneNumber: error_message_phoneNumber, code: error_message_code,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

			if (!user){
				const error = errorHandler(login_check_error);
				return res.status(200).json(error);
			}

			const verifyStatus = await checkVerifyCode(phoneNumber, code);

			if (!verifyStatus || verifyStatus.status && verifyStatus.status !== "approved"){
				const error = errorHandler(digit_code_error);
				return res.status(200).json(error);
			}

			if (!_.isEmpty(user)){
				await Users.update({verified: true, verifyLevel: 1}, {
					where: {id: user.id}
				});
			}

			const result = successHandler(registration_checked)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async setPassword(req, res, next) {
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
				where: {phoneNumber, deleted: 0},
			});

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

			let accessToken, refreshToken;
			if (!_.isEmpty(user)){
				accessToken = jwt.sign({userId: user.id, role: user.role}, JWT_SECRET, {expiresIn: '1h'}, void 0);
				refreshToken = jwt.sign({userId: user.id, role: user.role}, JWT_REFRESH_SECRET, {expiresIn: '7d'}, void 0);
				await Users.update({checked: true, refreshToken}, {where: {id: user.id}});
			}

			const result = successHandler(login, {tokens: {accessToken, refreshToken}, user: user})
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
				if (!exist){
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

	static async forgotCheckPassword(req, res, next) {
		try {
			const {phoneNumber, code} = req.body;
			const errors = await Validate(req.body, {
				code: 'integer|required|minLength:4|maxLength:4|min:0',
				phoneNumber: 'string|required|minLength:9|maxLength:20',
			}, {phoneNumber}, true, void 0, {
				phoneNumber: error_message_phoneNumber, code: error_message_code,
			})
			if (errors){
				return res.status(200).json(errors);
			}

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

			if (!user){
				const error = errorHandler(user_exist_error);
				return res.status(200).json(error);
			}

			const verifyStatus = await checkVerifyCode(phoneNumber, code);

			if (!verifyStatus || verifyStatus.status && verifyStatus.status !== "approved"){
				const error = errorHandler(digit_code_error);
				return res.status(200).json(error);
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

}

module.exports = UserController;
