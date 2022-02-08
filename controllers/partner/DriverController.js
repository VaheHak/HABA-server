const _ = require("lodash");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const Validate = require("../../config/validate");
const Users = require("../../models/user");
const PartnerBranch = require("../../models/partnerBranch");
const Driver = require("../../models/driver");
const DriverState = require("../../models/driverState");
const Car = require("../../models/car");
const Partner = require("../../models/partner");
const {subQueryPaging} = require("../../config/pagination");
const DeliveryService = require("../../models/deliveryService");
const transporter = require("../../config/nodemailer");
const {
	driver_create, phone_err, email_err, partner_subscribe_err
} = require("../../utils/resMessage");
const fs = require("fs");
const sharp = require("sharp");
const PartnerDriver = require("../../models/partnerDriver");
const PartnerBranchDriver = require("../../models/partnerBranchDriver");

const pageSize = 15;
const {NODEMAILER_USER} = process.env;

class DriverController {

	static async getDrivers(req, res, next) {
		try {
			const {
				active, partner, partnerBranch, type = 2, page = 1, state,
			} = req.query;
			await Validate(req.query, {
				active: 'string|minLength:2|maxLength:3',
				state: 'integer|min:1|max:3',
				type: 'integer|min:1|max:2',
				partner: 'required|integer|min:1',
				partnerBranch: 'required|integer|min:1',
				page: 'integer|required|min:0',
			})

			let filter = {};
			if (active){
				filter['$driverUser.active$'] = active
			}
			if (partner){
				filter['$driverPartner.id$'] = partner
			}
			if (partnerBranch){
				filter['$partnerBranchDrivers.id$'] = partnerBranch
			}
			if (state){
				filter['$stateDriver.state$'] = state
			}
			if (type){
				filter['$or'] = [{'type.0': +type}, {'type.1': +type},]
			}

			await Driver.findAndCountAll({
				where: [filter], include: [{
					model: DriverState, as: 'stateDriver', required: false,
				}, {
					model: Car, as: 'driverCars', required: false,
				}, {
					model: Users,
					as: 'driverUser',
					required: false,
					attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber', 'email'],
				}, {
					model: Partner, as: 'driverPartner', required: false,
				}, {
					model: PartnerBranch, as: 'partnerBranchDrivers', required: false,
				}, {
					model: DeliveryService, as: 'deliveryServices', required: false,
				}], subQuery: false, distinct: true,
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

	static async index(req, res, next) {
		try {
			await Validate(req.body, {
				email: 'required|email',
				message: 'required|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$|minLength:4|maxLength:100',
			})
			const {email, message} = req.body;
			let Info = `
                 <div style="width: 80%;height:100%;margin: 0 auto;color: black;">
                    <div style="width: 100%;height: 80px;font-weight: bold;font-size: 50px;
                    background: black;color: #1d70fc;margin: 0 auto 50px;font-family: monospace;
                    text-align: center;">HaBa Transportation</div>
                     <p style="word-break: break-word;margin: 0 0 30px 0;text-align: center;">${ message }</p>
                     <a style="width:30%;padding: 8px 20px;background: green;font-weight: bold;
                    text-align: center;color:white;margin: 0 auto 30px;display: block;
                    border-radius: 5px;text-decoration: none;box-shadow: 1px 1px 5px black"
                     href="mailto:${ email.toLowerCase() }" title="${ email.toLowerCase() }">
                     Reply:  ${ email.toLowerCase().slice(0, 30).concat("...") }</a>
                     <strong style="margin: 0 0 0 100px">Team HaBa</strong>
                </div>
            `
			await transporter.sendMail({
				from: `"HaBa" <${ NODEMAILER_USER }>`, to: email, subject: "HaBa - Delivery message", html: Info,
			}, (error, info) => {
				if (error){
					return console.log(error);
				}
				console.log('Message sent: ' + info.response);
			});
			await transporter.verify((err, success) => {
				if (err){
					const result = errorHandler('There is a problem in the server, please try again later ', err)
					return res.json(result);
				}
				const result = successHandler('Mail successfully send', success)
				return res.json(result);
			});
		} catch (e) {
			next(e);
		}
	}

	static async createDriver(req, res, next) {
		try {
			const {
				branchId, firstName, lastName, email, phoneNumber, password,
			} = req.body;
			await Validate(req.body, {
				branchId: 'integer|required|min:1',
				phoneNumber: 'required|string|minLength:9|maxLength:30',
				password: 'required|minLength:8|maxLength:20',
				email: 'required|email',
				firstName: 'required|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				lastName: 'required|string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
			}, {phoneNumber})

			const exist = await Partner.findOne({where: {userId: req.userId}});
			if (!exist || exist.subscribe === false){
				const error = errorHandler(partner_subscribe_err)
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

			const user = await Users.create({
				role: 3,
				firstName: _.trim(firstName),
				lastName: _.trim(lastName),
				email: email.toLowerCase(),
				phoneNumber,
				password,
				verifyLevel: '1',
			});

			const driver = await Driver.create({
				userId: user.id, type: [2]
			});

			if (!_.isEmpty(req.file)){
				const image = req.file;
				const fileTypes = {
					'image/webp': '.webp', 'image/png': '.png', 'image/jpeg': '.jpg',
				};

				const imageDir = `public/images/driver/${ driver.id }`;
				if (!fs.existsSync(imageDir)){
					fs.mkdirSync(imageDir, {recursive: true});
				}
				const images = `${ image.fieldname }-${ Date.now() }${ fileTypes[image.mimetype] }`;
				const imageFileName = `${ global.serverUrl }/images/driver/${ driver.id }/${ images }`;
				await sharp(image.buffer)
					.resize(300, 300, {
						fit: 'contain', background: {r: 255, g: 255, b: 255},
					})
					.toFile(imageDir + '/' + images);
				driver.avatar = imageFileName;
				await driver.save();
			}

			await PartnerDriver.create({
				driverId: driver.id, partnerId: exist.id
			});

			await PartnerBranchDriver.create({
				driverId: driver.id, partnerBranchId: branchId
			});

			const result = successHandler(driver_create, {driver, user} || {})
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = DriverController;
