const _ = require("lodash");
const {successHandler, errorHandler} = require("../../utils/responseHandlers");
const Validate = require("../../config/validate");
const {getPagination, getPagingData} = require("../../config/pagination");
const Clients = require("../../models/clients");
const {
	client_already_exist, client_create, nothing_deleted, client_delete, client_update, nothing_updated
} = require("../../utils/resMessage");
const pageSize = 15;

class ClientController {

	static async getClients(req, res, next) {
		try {
			const {page = 1, branchId} = req.query;
			await Validate(req.query, {
				page: 'integer|min:1',
				branchId: 'required|integer|min:1',
			})

			const {limit, offset} = getPagination(page, pageSize);

			await Clients.findAndCountAll({
				where: {branchId},
				offset: offset,
				limit: limit,
				distinct: true,
			}).then((data) => {
				const result = getPagingData(data, page, limit);
				const country = successHandler('ok', result || {})
				return res.json(country);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getClient(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			})

			const result = await Clients.findByPk(id);

			const country = successHandler('ok', result || {})
			return res.json(country);
		} catch (e) {
			next(e);
		}
	}

	static async postClient(req, res, next) {
		try {
			const {name, address, phoneNumber, email, branchId} = req.body;
			await Validate(req.body, {
				name: 'string|required|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				address: 'string|required|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				phoneNumber: 'string|required|minLength:9|maxLength:16',
				email: 'required|email',
				branchId: 'integer|required|min:1',
			}, {phoneNumber})

			const exist = await Clients.findOne({where: {phoneNumber}});
			if (!_.isEmpty(exist)){
				const error = errorHandler(client_already_exist);
				return res.json(error);
			}
			const emailExist = await Clients.findOne({where: {email}});
			if (!_.isEmpty(emailExist)){
				const error = errorHandler(client_already_exist);
				return res.json(error);
			}

			const clients = await Clients.create({
				name, address, phoneNumber, email, branchId: branchId ? branchId : null
			});

			const result = successHandler(client_create, clients || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateClient(req, res, next) {
		try {
			const {id, name, address, phoneNumber, email} = req.body;
			await Validate(req.body, {
				name: 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				address: 'string|regex:[a-zA-Zа-яА-ЯёЁա-ֆԱ-Ֆև0-9 ]$',
				phoneNumber: 'string|minLength:9|maxLength:16',
				email: 'email',
				id: 'required|integer|min:1',
			}, {phoneNumber})

			let update = {};
			if (name) update.name = name;
			if (address) update.address = address;
			if (phoneNumber){
				const exist = await Clients.findOne({where: {phoneNumber}});
				if (!_.isEmpty(exist)){
					const error = errorHandler(client_already_exist);
					return res.json(error);
				}
				update.phoneNumber = phoneNumber;
			}
			if (email){
				const emailExist = await Clients.findOne({where: {email}});
				if (!_.isEmpty(emailExist)){
					const error = errorHandler(client_already_exist);
					return res.json(error);
				}
				update.email = email;
			}

			const clients = await Clients.update({...update}, {where: {id}});

			const result = +_.get(clients, 0) === 1 ? successHandler(client_update) : errorHandler(nothing_updated)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteClient(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const clients = await Clients.destroy({
				where: {id}, limit: 1
			});

			const result = clients === 0 ? errorHandler(nothing_deleted) : successHandler(client_delete, clients)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = ClientController;
