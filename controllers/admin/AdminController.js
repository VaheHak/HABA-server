const _ = require("lodash");
const HttpError = require('http-errors');
const jwt = require("jsonwebtoken");
const fs = require("fs");
const Users = require("../../models/user");
const Validate = require("../../config/validate");
const Driver = require("../../models/driver");
const Car = require("../../models/car");
const DriverState = require("../../models/driverState");
const Partner = require("../../models/partner");
const PartnerBranch = require("../../models/partnerBranch");
const Country = require("../../models/country");
const City = require("../../models/city");
const Roles = require("../../models/roles");
const {subQueryPaging} = require("../../config/pagination");
const {checkVerifyCode} = require("../../config/smsVerify");
const {sendVerifyCode} = require("../../config/smsVerify");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const {getPagination, getPagingData} = require("../../config/pagination");
const Promise = require("bluebird");
const sharp = require("sharp");
const rimraf = require("rimraf");
const {
	login_error, digit_code_check, digit_code_error, login, not_authenticate, phone_err, user_create, driver_create,
	email_err, user_update, user_delete, driver_update, driver_delete, perm_err, not_full_verified, partner_create,
	partner_update, partner_delete, not_found, digit_code_send_err, verified_error, nothing_updated, number_exist,
	driver_exist, invitor_exist_err, login_check_error, username_err, deleted_user, user_exist_err,
	partner_exist_err, city_exist_err, country_exist_err, partner_branch_delete, pBranch_exist_err, driver_exist_err,
	user_not_verified, deleted_change, partner_already_exist, nothing_deleted,
} = require("../../utils/resMessage");
const PartnerDriver = require("../../models/partnerDriver");
const PartnerBranchDriver = require("../../models/partnerBranchDriver");

const {JWT_SECRET, JWT_REFRESH_SECRET} = process.env;
let pageSize = 15;

class AdminController {

	static async profile(req, res, next) {
		try {
			let filter = {};
			if (req.userId){
				filter.id = req.userId
			}
			const user = await Users.findOne({
				where: filter, include: [{
					model: Roles, as: 'roles', required: false,
				}], attributes: {exclude: ['password', 'refreshToken', 'restoreVerifyId', 'verified', 'verifyId', 'deleted']},
			});
			const myAccount = successHandler('ok', user);
			res.json(myAccount);
		} catch (e) {
			next(e);
		}
	}

	static async getUsers(req, res, next) {
		try {
			const {
				id,
				phoneNumber,
				username,
				firstName,
				lastName,
				email,
				verified,
				deleted,
				role,
				sortKey = 'id',
				sort = "true",
				page = 1,
				s = '',
			} = req.query;
			await Validate(req.query, {
				id: 'integer|min:0',
				phoneNumber: 'string|maxLength:12',
				verified: 'array',
				'verified.*': 'integer|min:0',
				deleted: 'array',
				'deleted.*': 'integer|min:0',
				role: 'integer|min:0',
				email: 'string',
				page: 'integer|min:0',
				username: 'string',
				firstName: 'string',
				lastName: 'string',
				sortKey: 'string',
				sort: 'boolean',
			})

			let filter = {};
			if (id){
				filter.id = id
			}
			if (phoneNumber){
				filter.phoneNumber = {$like: `%${ phoneNumber }%`}
			}
			if (username){
				filter.username = {$like: `${ username.toLowerCase() }%`}
			}
			if (firstName){
				filter.firstName = {$like: `${ firstName }%`}
			}
			if (lastName){
				filter.lastName = {$like: `${ lastName }%`}
			}
			if (email){
				filter.email = {$like: `%${ email.toLowerCase() }%`};
			}
			if (verified){
				filter.verified = {$or: verified}
			}
			if (deleted){
				filter.deleted = {$or: deleted}
			}
			if (role){
				filter.role = role
			}
			if (s){
				filter['$or'] = [{id: {$like: `${ s }%`}},
					{firstName: {$like: `${ s }%`}},
					{lastName: {$like: `${ s }%`}},
					{phoneNumber: {$like: `${ s }%`}},
					{username: {$like: `${ s }%`}},]
			}

			const {limit, offset} = getPagination(page, pageSize);

			await Users.findAndCountAll({
				where: [filter, {role: {$notIn: +req.role === 2 ? [1, 2] : []}}],
				include: [{
					model: Users, as: 'invite', required: false,
				}, {
					model: Users, as: 'userInvitor', required: false,
				}, {
					model: Roles, as: 'roles', required: false,
				}],
				offset: offset,
				limit: limit,
				distinct: true,
				order: [[sortKey ? sortKey : 'id', sort === "true" ? 'ASC' : 'DESC'],],
			}).then((data) => {
				const result = getPagingData(data, page, limit);
				const users = successHandler('ok', result);
				return res.json(users);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getUser(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			})

			let filter = {};
			if (id){
				filter.id = id
			}

			const user = await Users.findOne({
				where: [filter, {role: {$notIn: +req.role === 2 ? [1, 2] : []}}], include: [{
					model: Users, as: 'invite', required: false,
				}, {
					model: Users, as: 'userInvitor', required: false,
				}, {
					model: Roles, as: 'roles', required: false,
				}], distinct: true,
			})

			const users = successHandler('ok', user);
			return res.json(users);
		} catch (e) {
			next(e);
		}
	}

	static async getDrivers(req, res, next) {
		try {
			const {
				id, make, model, color, year, passengersSeat, number, partner,
				type, sortKey = 'id', sort = "true", i = '', page = 1, state, s = ''
			} = req.query;
			await Validate(req.query, {
				id: 'integer|min:0',
				make: 'string',
				model: 'string',
				color: 'string',
				year: 'string',
				passengersSeat: 'integer|min:0',
				number: 'string',
				partner: 'integer|min:0',
				page: 'integer|required|min:0',
				sortKey: 'string',
				sort: 'boolean',
				i: 'string',
			})

			let filter = {};
			if (id){
				filter.id = id
			}
			if (make){
				filter['$driverCars.make$'] = {$like: `%${ make }%`}
			}
			if (model){
				filter['$driverCars.model$'] = {$like: `%${ model }%`}
			}
			if (color){
				filter['$driverCars.color$'] = {$like: `%${ color }%`}
			}
			if (year){
				filter['$driverCars.year$'] = year
			}
			if (passengersSeat){
				filter['$driverCars.passengersSeat$'] = passengersSeat
			}
			if (number){
				filter['$driverCars.number$'] = {$like: `%${ number }%`}
			}
			if (partner){
				filter['$driverPartner.id$'] = partner
			}
			if (state){
				filter['$stateDriver.state$'] = state
			}
			if (s){
				filter['$or'] = [{id: {$like: `${ s }%`}}, {'$driverUser.firstName$': {$like: `${ s }%`}}, {'$driverUser.lastName$': {$like: `${ s }%`}}, {'$driverUser.phoneNumber$': {$like: `${ s }%`}}, {'$driverUser.username$': {$like: `${ s }%`}},]
			}
			if (type){
				filter['$or'] = [{'type.0': +type}, {'type.1': +type},]
			}

			await Driver.findAndCountAll({
				where: [filter],
				include: [{
					model: DriverState, as: 'stateDriver', required: false,
				}, {
					model: Car, as: 'driverCars', required: false,
				}, {
					model: Users,
					as: 'driverUser',
					required: false,
					attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
				}, {
					model: Partner, as: 'driverPartner', required: false,
				}],
				subQuery: false,
				distinct: true,
				order: sortKey && sortKey !== 'id' && sortKey !== 'type' ?
					[[sortKey, i ? i : 'id', sort === "true" ? 'ASC' : 'DESC']] :
					[[i ? i : 'id', sort === "true" ? 'ASC' : 'DESC']],
			}).then(async (data) => {
				const result = subQueryPaging(data, page, pageSize);
				const drivers = successHandler('ok', result || []);
				return res.json(drivers);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getDriver(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			})

			let filter = {};
			if (id){
				filter.id = id
			}

			const result = await Driver.findOne({
				where: [filter], include: [{
					model: DriverState, as: 'stateDriver', required: false,
				}, {
					model: Car, as: 'driverCars', required: false,
				}, {
					model: Users,
					as: 'driverUser',
					required: false,
					attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
				}, {
					model: Partner, as: 'driverPartner', required: false, include: [{
						model: PartnerBranch, as: 'partnerBranches', required: false,
					}]
				}, {
					model: PartnerBranch, as: 'partnerBranchDrivers', required: false,
				}], distinct: true,
			})

			const drivers = successHandler('ok', result || []);
			return res.json(drivers);
		} catch (e) {
			next(e);
		}
	}

	static async getPartners(req, res, next) {
		try {
			const {
				country,
				city,
				name,
				user,
				deliveryPrice,
				membershipPrice,
				lastMembershipPayment,
				nextMembershipPayment,
				page = 1,
			} = req.query;
			await Validate(req.query, {
				country: 'integer|min:0',
				city: 'integer|min:0',
				name: 'string',
				user: 'integer|min:0',
				deliveryPrice: 'integer|min:0',
				membershipPrice: 'integer|min:0',
				lastMembershipPayment: 'integer|min:0',
				nextMembershipPayment: 'integer|min:0',
				page: 'integer|required|min:0',
			})

			let filter = {};
			if (country){
				filter['$partnerBranches.countryId$'] = country
			}
			if (city){
				filter['$partnerBranches.cityId$'] = city
			}
			if (name){
				filter.name = {$like: `${ name }%`}
			}
			if (user){
				filter.userId = user;
			}
			if (deliveryPrice){
				filter.deliveryPrice = deliveryPrice;
			}
			if (membershipPrice){
				filter.membershipPrice = membershipPrice;
			}
			if (lastMembershipPayment){
				filter.lastMembershipPayment = lastMembershipPayment;
			}
			if (nextMembershipPayment){
				filter.nextMembershipPayment = nextMembershipPayment;
			}

			await Partner.findAndCountAll({
				where: [filter], include: [{
					model: PartnerBranch, as: 'partnerBranches', required: false, include: [{
						model: Country, as: 'branchCountry', required: false,
					}, {
						model: City, as: 'branchCity', required: false,
					}]
				}], subQuery: false, distinct: true,
			}).then((data) => {
				const result = subQueryPaging(data, page, pageSize);
				const partner = successHandler('ok', result || []);
				return res.json(partner);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getPartner(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			})

			let filter = {};
			if (id){
				filter.id = id
			}

			const result = await Partner.findOne({
				where: [filter], include: [{
					model: PartnerBranch, as: 'partnerBranches', required: false, include: [{
						model: Country, as: 'branchCountry', required: false,
					}, {
						model: City, as: 'branchCity', required: false,
					}, {
						model: Driver, as: 'driverPartnerBranches', required: false, include: [{
							model: Users,
							as: 'driverUser',
							required: false,
							attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
						}]
					}]
				}, {
					model: Users,
					as: 'partnerUser',
					required: false,
					attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
				},],
			})

			const partner = successHandler('ok', result || []);
			return res.json(partner);
		} catch (e) {
			next(e);
		}
	}

	static async adminLogin(req, res, next) {
		try {
			const {phoneNumber, password} = req.body;
			await Validate(req.body, {
				phoneNumber: 'string|required|minLength:9|maxLength:16',
				password: 'required|minLength:8|maxLength:20',
			}, {phoneNumber})

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

			if (!user || user.getDataValue('password') !== Users.passwordHash(password)){
				const error = errorHandler(login_error);
				return res.status(422).json(error);
			}

			if (![1, 2].includes(+user.role)){
				const error = errorHandler(not_found);
				return res.status(404).json(error);
			}

			const verifyStatus = await sendVerifyCode(phoneNumber);

			let result;
			if (verifyStatus && verifyStatus.status === "pending"){
				await Users.update({verifyId: verifyStatus.sid, checked: false}, {
					where: {id: user.id}
				});
				result = successHandler(digit_code_check, verifyStatus)
			} else{
				result = errorHandler(digit_code_send_err)
			}

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async checkAdminLogin(req, res, next) {
		try {
			const {phoneNumber, code} = req.body;
			await Validate(req.body, {
				phoneNumber: 'string|required|minLength:9|maxLength:12',
				code: 'integer|required|minLength:4|maxLength:4|min:0',
			})

			const user = await Users.findOne({
				where: {phoneNumber, deleted: 0}
			});

			if (!user){
				const error = errorHandler(login_check_error);
				return res.status(200).json(error);
			}

			if (user && ![1, 2].includes(+user.role)){
				const error = errorHandler(not_found);
				return res.status(404).json(error);
			}

			const verifyStatus = await checkVerifyCode(phoneNumber, code);

			if (!verifyStatus || verifyStatus.status && verifyStatus.status !== "approved"){
				const error = errorHandler(digit_code_error);
				return res.status(200).json(error);
			}

			if (user.checked === true){
				const error = errorHandler(verified_error);
				return res.status(200).json(error);
			}

			let token, refresh_token;
			if (!_.isEmpty(user)){
				token = jwt.sign({userId: user.id, role: user.role}, JWT_SECRET, {expiresIn: '1h'}, void 0);
				refresh_token = jwt.sign({userId: user.id, role: user.role}, JWT_REFRESH_SECRET, {expiresIn: '7d'}, void 0);
				await Users.update({checked: true, restoreVerifyId: verifyStatus.sid, refreshToken: refresh_token}, {
					where: {id: user.id}
				});
			}

			const result = successHandler(login, {access_token: token, refresh_token})
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async resetToken(req, res, next) {
		try {
			await Validate(req.body, {
				refreshToken: 'required|string',
			})
			const {refreshToken} = req.body;

			if (!refreshToken){
				const error = errorHandler(not_authenticate)
				return res.json(error);
			}

			jwt.verify(refreshToken, JWT_REFRESH_SECRET, void 0, async (err, data) => {
				if (!err){
					const user = await Users.findByPk(data.userId);
					if (_.isEmpty(user)){
						const error = errorHandler(not_authenticate);
						return res.status(401).json(error);
					}
					if (user.deleted === true){
						const error = errorHandler(user_exist_err);
						return res.status(401).json(error);
					}

					const accessToken = jwt.sign({userId: data.userId, role: data.role}, JWT_SECRET, {expiresIn: '1h'}, void 0);
					const result = successHandler("ok", accessToken)
					return res.json(result);
				} else{
					throw HttpError(401, {status: false, errors: not_authenticate, data: null});
				}
			});
		} catch (e) {
			next(e);
		}
	}

	static async createUser(req, res, next) {
		try {
			const {phoneNumber, password, verified, invitor, role} = req.body;
			await Validate(req.body, {
				phoneNumber: 'string|required|minLength:9|maxLength:30',
				password: 'required|minLength:8|maxLength:20',
				verified: 'boolean',
				invitor: 'integer|min:0',
				role: 'integer|min:0',
			}, {phoneNumber})

			if (phoneNumber){
				const uniquePhone = await Users.findOne({where: {phoneNumber}});
				if (uniquePhone){
					const error = errorHandler(phone_err)
					return res.status(422).json(error);
				}
			}
			if (invitor){
				const invitorExist = await Users.findOne({where: {invitor}});
				if (!invitorExist){
					const error = errorHandler(invitor_exist_err)
					return res.status(422).json(error);
				}
			}
			if ([1, 2].includes(role) && +req.role === 2){
				const error = errorHandler(perm_err)
				return res.status(422).json(error);
			}

			const user = await Users.create({
				phoneNumber,
				password,
				verified: verified ? verified : 0,
				invitor: invitor ? invitor : null,
				role: role && [1, 2].includes(+req.role) ? role : 4
			});

			const result = successHandler(user_create, user || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async createDriver(req, res, next) {
		try {
			const {
				carMake, carModel, carColor, carYear, carPassengersSeat, carNumber, userId, type,
			} = req.body;
			await Validate(req.body, {
				userId: 'integer|required|min:0',
				carMake: 'required|string|alphaDash',
				carModel: 'required|string|alphaDash',
				carColor: 'required|string|alpha',
				carYear: 'required|integer|min:0',
				carPassengersSeat: 'required|integer|min:0',
				carNumber: 'required|string|alphaNumeric',
				type: 'required|array|length:2',
				"type.*": 'requiredWith:type|integer|min:1|max:2',
			})

			if (userId){
				const exist = await Users.findOne({where: {id: userId, deleted: 0}});
				if (!exist){
					const error = errorHandler(user_exist_err, userId)
					return res.json(error);
				}
				if (exist.verified === false){
					const error = errorHandler(user_not_verified)
					return res.json(error);
				}
				if (+exist.verifyLevel !== 3 && +req.role === 2){
					const error = errorHandler(not_full_verified)
					return res.json(error);
				}

				const unique = await Driver.findOne({where: {userId}});
				if (unique){
					const error = errorHandler(driver_exist, userId)
					return res.json(error);
				}
			}

			if (carNumber){
				const unique = await Car.findOne({where: {number: carNumber}});
				if (unique){
					const error = errorHandler(number_exist, carNumber)
					return res.json(error);
				}
			}

			const driver = await Driver.create({
				userId, type
			});

			const user = await Users.update({
				role: 3
			}, {where: {id: userId, deleted: 0}});

			let car;
			if (driver){
				car = await Car.create({
					driverId: driver.id,
					make: carMake,
					model: carModel,
					color: carColor,
					year: carYear,
					passengersSeat: carPassengersSeat ? carPassengersSeat : null,
					number: carNumber,
				});
			}

			const result = successHandler(driver_create, {driver, car, user} || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async createPartner(req, res, next) {
		try {
			const {
				name, deliveryPrice, membershipPrice, lastMembershipPayment, nextMembershipPayment, user, branches,
				routes, routePrice,
			} = req.body;
			const b = _.map(branches || [], (v) => ({
				address: v.address,
				country: v.country,
				city: v.city,
				isGeneral: v.isGeneral,
				coords: v.coords,
				drivers: v.drivers,
			}));
			const {body} = req;
			_.set(body, 'branch', !_.isEmpty(b) ? b : [{}])
			await Validate(body, {
				name: 'regex:[a-zA-Z ]$|string|required',
				deliveryPrice: 'integer|required|min:0',
				membershipPrice: 'integer|required|min:0',
				lastMembershipPayment: 'integer|required|min:0',
				nextMembershipPayment: 'integer|required|min:0',
				user: 'integer|required|min:0',
				routes: 'requiredWith:routePrice|array|latLong|length:2',
				routePrice: 'requiredWith:routes|integer|min:0',
				branch: 'array|required',
				'branch.*.address': 'required|string|regex:[a-zA-Z0-9 ]$',
				'branch.*.country': 'integer|required|min:0',
				'branch.*.city': 'integer|required|min:0',
				'branch.*.isGeneral': 'boolean',
				'branch.*.coords': 'required|array|latLong|length:2',
				'branch.*.coords.*': 'required',
				'branch.*.drivers': 'array',
				'branch.*.drivers.*': 'integer',
			});

			await Validate(req, {
				file: 'mime:jpg,png,gif',
			});

			const exist = await Users.findByPk(user);
			if (user && _.isEmpty(exist)){
				const error = errorHandler(user_exist_err, user);
				return res.json(error);
			}
			if (user && exist && +exist.role !== 4){
				const error = errorHandler(partner_already_exist);
				return res.json(error);
			}

			if (!_.isEmpty(branches)){
				const errors = [];
				const cityErrors = [];
				const driverErrors = [];
				await Promise.map(branches, async (v) => {
					const exist = await Country.findByPk(v.country);
					const cityExist = await City.findByPk(v.city);
					if (_.isEmpty(exist)) errors.push(v.country);
					if (_.isEmpty(cityExist)) errors.push(v.city);
					if (v.drivers){
						await Promise.map(v.drivers || [], async (d) => {
							const driverExist = await Driver.findByPk(d);
							if (_.isEmpty(driverExist) || !driverExist.type.includes(2)) driverErrors.push(d)
						})
					}
				})
				if (!_.isEmpty(errors)){
					const error = errorHandler(country_exist_err, errors);
					return res.json(error);
				}
				if (!_.isEmpty(cityErrors)){
					const error = errorHandler(city_exist_err, cityErrors);
					return res.json(error);
				}
				if (!_.isEmpty(driverErrors)){
					const error = errorHandler(driver_exist_err, driverErrors);
					return res.json(error);
				}
			}

			const partner = await Partner.create({
				name, deliveryPrice, membershipPrice, userId: +user, lastMembershipPayment, nextMembershipPayment,
				routes, routePrice: routePrice ? routePrice : null,
			});
			if (user){
				await Users.update({role: 5}, {where: {id: user}});
			}

			let branch;
			if (partner){
				if (branches){
					branch = await Promise.map(branches, async (d) => {
						const pb = await PartnerBranch.create({
							address: d.address,
							countryId: d.country ? +d.country : null,
							cityId: d.city ? +d.city : null,
							isGeneral: d.isGeneral ? d.isGeneral : false,
							coords: d.coords ? d.coords : null,
							partnerId: partner.id,
						});
						if (pb){
							await Promise.map(d.drivers || [], async (v) => {
								const same = await PartnerDriver.findOne({where: {partnerId: partner.id, driverId: v}});
								if (_.isEmpty(same)){
									await PartnerDriver.create({partnerId: partner.id, driverId: v});
								}
								const sameB = await PartnerBranchDriver.findOne({where: {partnerBranchId: pb.id, driverId: v}});
								if (_.isEmpty(sameB)){
									await PartnerBranchDriver.create({partnerBranchId: pb.id, driverId: v});
								}
							});
						}
						return pb;
					})
				}

				if (!_.isEmpty(req.file)){
					const image = req.file;
					const fileTypes = {
						'image/webp': '.webp', 'image/png': '.png', 'image/jpeg': '.jpg',
					};

					const imageDir = `public/images/partner/${ partner.id }`;
					if (!fs.existsSync(imageDir)){
						fs.mkdirSync(imageDir, {recursive: true});
					}
					const images = `${ image.fieldname }-${ Date.now() }${ fileTypes[image.mimetype] }`;
					const imageFileName = `${ global.serverUrl }/images/partner/${ partner.id }/${ images }`;
					await sharp(image.buffer)
						.resize(500, 500, {
							fit: 'contain', background: {r: 255, g: 255, b: 255},
						})
						.toFile(imageDir + '/' + images);
					partner.image = imageFileName;
					await partner.save();
				}
			}

			const result = successHandler(partner_create, partner || {})
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateUser(req, res, next) {
		try {
			const {
				id, phoneNumber, username, firstName, lastName, email, password, verified, deleted, role
			} = req.body;
			await Validate(req.body, {
				id: 'required|integer|min:0',
				phoneNumber: 'string|minLength:9|maxLength:30',
				password: 'minLength:8|maxLength:20',
				verified: 'boolean',
				deleted: 'boolean',
				role: 'integer|min:0',
				email: 'email',
				username: 'alphaDash',
				firstName: 'alphaDash',
				lastName: 'alphaDash',
			}, {phoneNumber})

			const user = await Users.findByPk(id);
			if (!deleted && user.deleted === true){
				const error = errorHandler(deleted_user)
				return res.json(error);
			}
			if (+role === 3 && +user.verifyLevel !== 3 && +req.role === 2){
				const error = errorHandler(not_full_verified)
				return res.json(error);
			}
			if (+role === 3 && user.verified === false && +req.role === 2){
				const error = errorHandler(perm_err)
				return res.json(error);
			}
			if ([1, 2].includes(+user.role) && +req.role !== 1){
				const error = errorHandler(perm_err)
				return res.json(error);
			}

			if (phoneNumber){
				const uniquePhone = await Users.findOne({where: {phoneNumber}});
				if (uniquePhone){
					const error = errorHandler(phone_err)
					return res.status(422).json(error);
				}
			}
			if (email){
				const uniqueEmail = await Users.findOne({where: {email: email.toLowerCase()}})
				if (uniqueEmail){
					const error = errorHandler(email_err)
					return res.json(error);
				}
			}
			if (_.trim(username)){
				const uniqueUsername = await Users.findOne({where: {username: _.trim(username.toLowerCase())}})
				if (uniqueUsername){
					const error = errorHandler(username_err)
					return res.status(422).json(error);
				}
			}

			let field = {};
			if (phoneNumber){
				field.phoneNumber = phoneNumber
			}
			if (_.trim(username)){
				field.username = _.trim(username.toLowerCase())
			}
			if (_.trim(firstName)){
				field.firstName = _.trim(firstName)
			}
			if (_.trim(lastName)){
				field.lastName = _.trim(lastName)
			}
			if (verified){
				field.verified = verified
			}
			if (deleted){
				field.deleted = deleted
			}
			if (email){
				field.email = email.toLowerCase()
			}
			if (password){
				field.password = password
			}
			if (role && +req.role === 1){
				field.role = role
			}
			let userRole;
			if (role && +req.role === 2){
				if (![1, 2].includes(+role)){
					userRole = await Users.update({role}, {where: {id, role: {$notIn: [1, 2]}, verified: true, deleted: 0}});
				} else{
					const error = errorHandler({role: perm_err})
					return res.status(422).json(error);
				}
			}

			let u;
			if (user.deleted === false){
				u = await Users.update({...field}, {where: {id}});
			}

			if (user.deleted === true && deleted){
				const d = await Users.update({deleted}, {where: {id}});
				const result = d && d[0] === 1 ? successHandler(deleted_change, d) : errorHandler(nothing_updated);
				return res.json(result);
			}

			const result = (u && u[0] === 1) || (userRole && userRole[0] === 1) ? successHandler(user_update, {
				user: u, userRole
			}) : errorHandler(nothing_updated);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateDriver(req, res, next) {
		try {
			const {
				id, status, rating, carMake, carModel, carColor, carYear, carPassengersSeat, carNumber, state,
				orderType, orderId, type
			} = req.body;
			await Validate(req.body, {
				id: 'integer|required|min:0|requiredWithout:delPartner',
				status: 'string|alphaDash',
				rating: 'string|alphaDash',
				carMake: 'string|alphaDash',
				carModel: 'string|alphaDash',
				carColor: 'string|alpha',
				carYear: 'integer|min:0',
				carPassengersSeat: 'integer|min:0',
				carNumber: 'string|alphaDash',
				state: 'string|alphaDash',
				orderType: 'string|alphaDash',
				orderId: 'string|alphaDash',
				type: 'array|length:2',
				"type.*": 'requiredWith:type|integer|min:1|max:2',
			})
			let update = {};
			if (status){
				update.status = status
			}
			if (rating){
				update.rating = rating
			}
			if (type){
				update.type = type;
				if (!type.includes(2)){
					await PartnerDriver.destroy({where: {driverId: id}});
					await PartnerBranchDriver.destroy({where: {driverId: id}});
				}
			}

			const driverId = await Driver.findByPk(id);
			if (driverId){
				const user = await Users.findByPk(driverId.userId);
				if (user && user.deleted === true){
					const error = errorHandler(deleted_user)
					return res.json(error);
				}
				if (user && +user.verifyLevel !== 3 && +req.role === 2){
					const error = errorHandler(not_full_verified)
					return res.json(error);
				}
			}

			if (carNumber){
				const unique = await Car.findOne({where: {number: carNumber}});
				if (unique){
					const error = errorHandler(number_exist, carNumber)
					return res.json(error);
				}
			}

			const driver = await Driver.update({...update}, {where: {id}});

			const ds = await DriverState.findOne({where: {driverId: id}})
			let newOrderType, newOrderId, driverState;
			if (state && state !== 'available' && ds.state !== 'available'){
				newOrderType = orderType;
				newOrderId = orderId;
			}

			if (_.isEmpty(ds)){
				driverState = await DriverState.create({
					state: state ? state : 1, orderType: newOrderType, orderId: newOrderId, driverId: id
				});
			} else{
				driverState = await DriverState.update({
					state: state ? state : ds.state,
					orderType: orderType ? newOrderType : ds.orderType,
					orderId: orderId ? newOrderId : ds.orderId
				}, {
					where: {id: ds.id}
				});
			}

			let carUpdate = {};
			if (carMake){
				carUpdate.make = carMake
			}
			if (carModel){
				carUpdate.model = carModel
			}
			if (carColor){
				carUpdate.color = carColor
			}
			if (carYear){
				carUpdate.year = carYear
			}
			if (carPassengersSeat){
				carUpdate.passengersSeat = carPassengersSeat
			}
			if (carNumber){
				carUpdate.number = carNumber
			}
			const car = await Car.update({...carUpdate}, {where: {driverId: id}});

			const result = successHandler(driver_update, {driver, car, driverState} || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updatePartner(req, res, next) {
		try {
			const {
				id,
				name,
				user,
				deliveryPrice,
				membershipPrice,
				lastMembershipPayment,
				nextMembershipPayment,
				branches,
				deleteBranchId,
				delDriverId,
				branchId, routes, routePrice
			} = req.body;
			const b = _.map(branches || [], (v) => ({
				id: v.id,
				address: v.address,
				country: v.country,
				city: v.city,
				isGeneral: v.isGeneral,
				coords: v.coords,
				drivers: v.drivers,
			}));
			const {body} = req;
			_.set(body, 'branch', !_.isEmpty(b) ? b : [])
			await Validate(body, {
				id: 'integer|required|min:0',
				name: 'string|regex:[a-zA-Z0-9 ]$',
				user: 'integer|min:0',
				deliveryPrice: 'integer|min:0',
				membershipPrice: 'integer|min:0',
				lastMembershipPayment: 'integer|min:0',
				nextMembershipPayment: 'integer|min:0',
				routes: 'array|latLong|length:2',
				routePrice: 'integer|min:0',
				branch: 'array',
				'branch.*.id': 'integer|min:0',
				'branch.*.address': 'string|regex:[a-zA-Z0-9 ]$',
				'branch.*.country': 'integer|min:0',
				'branch.*.city': 'integer|min:0',
				'branch.*.isGeneral': 'boolean',
				'branch.*.coords': 'array|latLong|length:2',
				'branch.*.drivers': 'array',
				'branch.*.drivers.*': 'integer',
				deleteBranchId: 'integer|min:0',
				delDriverId: 'integer|min:0|requiredWith:branchId',
				branchId: 'integer|min:0|requiredWith:delDriverId',
			})

			await Validate(req, {
				file: 'mime:jpg,png,gif',
			});

			const p = await Partner.findByPk(id);
			if (_.isEmpty(p)){
				const error = errorHandler(partner_exist_err, id);
				return res.json(error);
			}

			if (delDriverId){
				const deleted = await PartnerBranchDriver.destroy({where: {partnerBranchId: branchId, driverId: delDriverId}});
				const pb = await PartnerBranch.findAll({where: {partnerId: id}})
				let existAll;
				await Promise.map(pb, async (v) => {
					existAll = await PartnerBranchDriver.findOne({
						where: {partnerBranchId: v.id, driverId: delDriverId}
					});
					return existAll;
				});
				const same = await PartnerDriver.findOne({where: {partnerId: id, driverId: delDriverId}});
				if (!_.isEmpty(same) && _.isEmpty(existAll)){
					await PartnerDriver.destroy({where: {partnerId: id, driverId: delDriverId}});
				}
				const result = deleted === 0 ? errorHandler(driver_exist_err, delDriverId) : successHandler(driver_delete, deleted || []);
				return res.json(result);
			}

			const exist = await Users.findByPk(user);
			if (user && _.isEmpty(exist)){
				const error = errorHandler(user_exist_err, user);
				return res.json(error);
			}
			if (user && exist && +exist.role !== 4){
				const error = errorHandler(partner_already_exist);
				return res.json(error);
			}

			if (!_.isEmpty(branches)){
				const errors = [];
				const cityErrors = [];
				const driverErrors = [];
				await Promise.map(branches, async (v) => {
					if (v.country){
						const exist = await Country.findByPk(v.country);
						if (_.isEmpty(exist)){
							errors.push(v.country)
						}
					}
					if (v.city){
						const cityExist = await City.findByPk(v.city);
						if (_.isEmpty(cityExist)){
							errors.push(v.city)
						}
					}
					if (v.drivers){
						await Promise.map(v.drivers || [], async (d) => {
							const driverExist = await Driver.findByPk(d);
							if (_.isEmpty(driverExist) || !driverExist.type.includes(2)) driverErrors.push(d)
						})
					}
				})
				if (!_.isEmpty(errors)){
					const error = errorHandler(country_exist_err, errors);
					return res.json(error);
				}
				if (!_.isEmpty(cityErrors)){
					const error = errorHandler(city_exist_err, cityErrors);
					return res.json(error);
				}
				if (!_.isEmpty(driverErrors)){
					const error = errorHandler(driver_exist_err, driverErrors);
					return res.json(error);
				}
			}

			let deleteBranch;
			if (deleteBranchId){
				const exist = await PartnerBranch.findByPk(deleteBranchId);
				if (!_.isEmpty(exist)){
					deleteBranch = await PartnerBranch.destroy({
						where: {id: deleteBranchId}, limit: 1
					});
				}
			}
			if (deleteBranch){
				const r = +deleteBranch === 1 ? successHandler(partner_branch_delete, deleteBranch) : errorHandler(nothing_updated, deleteBranch);
				return res.json(r);
			}

			let update = {};
			if (name){
				update.name = name
			}
			if (user){
				update.userId = user;
				await Users.update({role: 5}, {where: {id: user}});
				if (p) await Users.update({role: 4}, {where: {id: p.userId}});
			}
			if (deliveryPrice){
				update.deliveryPrice = deliveryPrice;
			}
			if (membershipPrice){
				update.membershipPrice = membershipPrice;
			}
			if (lastMembershipPayment){
				update.lastMembershipPayment = lastMembershipPayment;
			}
			if (nextMembershipPayment){
				update.nextMembershipPayment = nextMembershipPayment;
			}
			if (routes){
				update.routes = routes;
			}
			if (routePrice){
				update.routePrice = routePrice;
			}
			if (!_.isEmpty(req.file)){
				const image = req.file;
				const fileTypes = {
					'image/webp': '.webp', 'image/png': '.png', 'image/jpeg': '.jpg',
				};

				const removeDir = `public/images/partner/${ id }`;
				if (fs.existsSync(removeDir)){
					rimraf.sync(removeDir);
				}

				const imageDir = `public/images/partner/${ id }`;
				if (!fs.existsSync(imageDir)){
					fs.mkdirSync(imageDir, {recursive: true});
				}
				const images = `${ image.fieldname }-${ Date.now() }${ fileTypes[image.mimetype] }`;
				const imageFileName = `${ global.serverUrl }/images/partner/${ id }/${ images }`;
				await sharp(image.buffer)
					.resize(500, 500, {
						fit: 'contain', background: {r: 255, g: 255, b: 255},
					})
					.toFile(imageDir + '/' + images);
				update.image = imageFileName;
			}
			const partner = await Partner.update({...update}, {where: {id}});

			let partnerBranch;
			if (branches){
				await Promise.map(branches, async (d) => {
					const branch = await PartnerBranch.findByPk(d.id);
					if (_.isEmpty(branch)){
						partnerBranch = await PartnerBranch.create({
							address: d.address ? d.address : null,
							countryId: d.country ? +d.country : null,
							cityId: d.city ? +d.city : null,
							isGeneral: d.isGeneral ? d.isGeneral : false,
							coords: d.coords ? d.coords : null,
							partnerId: id,
						});
						if (partnerBranch){
							await Promise.map(d.drivers || [], async (v) => {
								const same = await PartnerDriver.findOne({where: {partnerId: id, driverId: v}});
								if (_.isEmpty(same)){
									await PartnerDriver.create({partnerId: id, driverId: v});
								}
								const sameB = await PartnerBranchDriver.findOne({
									where: {
										partnerBranchId: partnerBranch.id, driverId: v
									}
								});
								if (_.isEmpty(sameB)){
									await PartnerBranchDriver.create({partnerBranchId: partnerBranch.id, driverId: v});
								}
							});
						}
					} else{
						let updateBranch = {};
						if (d.address){
							updateBranch.address = d.address
						}
						if (d.country){
							updateBranch.countryId = d.country
						}
						if (d.city){
							updateBranch.cityId = d.city
						}
						if (d.isGeneral){
							updateBranch.isGeneral = d.isGeneral
						}
						if (d.coords && d.coords[0] && d.coords[1]){
							updateBranch.coords = d.coords
						}
						partnerBranch = await PartnerBranch.update({...updateBranch}, {
							where: {id: d.id, partnerId: id}
						});
						if (d.id){
							await Promise.map(d.drivers || [], async (v) => {
								const same = await PartnerDriver.findOne({where: {partnerId: id, driverId: v}});
								if (_.isEmpty(same)){
									await PartnerDriver.create({partnerId: id, driverId: v});
								}
								const sameB = await PartnerBranchDriver.findOne({where: {partnerBranchId: d.id, driverId: v}});
								if (_.isEmpty(sameB)){
									await PartnerBranchDriver.create({partnerBranchId: d.id, driverId: v});
								}
							});
						}
					}
				})
			}

			const result = _.get(partner, 0) === 0 && _.isEmpty(partnerBranch) ? errorHandler(nothing_updated, {
				partner,
				partnerBranch
			}) : successHandler(partner_update, {partner, partnerBranch});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteUser(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			let user;
			if (+req.role === 1){
				user = await Users.update({
					deleted: true,
				}, {
					where: {id, deleted: 0}, limit: 1
				});
			}
			if (+req.role === 2){
				user = await Users.update({
					deleted: true,
				}, {
					where: {id, deleted: 0, role: {$ne: 1}}, limit: 1
				});
			}

			const result = _.get(user, 0) === 0 ? errorHandler(nothing_deleted) : successHandler(user_delete, user[0])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteDriver(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const find = await Driver.findByPk(id);
			if (find){
				await Users.update({role: 4}, {where: {id: find.userId}});
			}

			let driver;
			if (+req.role === 1){
				driver = await Driver.destroy({
					where: {id}, limit: 1
				});
			}
			if (+req.role === 2){
				driver = await Driver.destroy({
					where: {id, role: {$ne: 1}}, limit: 1
				});
			}

			const result = driver === 0 ? errorHandler(nothing_deleted) : successHandler(driver_delete, driver)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deletePartner(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const partner = await Partner.destroy({
				where: {id}, limit: 1
			});

			if (partner === 1){
				const removeDir = `public/images/partner/${ id }/`;
				if (fs.existsSync(removeDir)){
					fs.rmdirSync(removeDir, {recursive: true});
				}
			}

			const result = partner === 0 ? errorHandler(nothing_deleted) : successHandler(partner_delete, partner)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = AdminController;
