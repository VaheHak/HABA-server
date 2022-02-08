const _ = require("lodash");
const Validate = require("../../config/validate");
const Country = require("../../models/country");
const City = require("../../models/city");
const Route = require("../../models/route");
const Service = require("../../models/service");
const {errorHandler, successHandler} = require("../../utils/responseHandlers");
const {getPagination, getPagingData} = require("../../config/pagination");

const {
	location_create, location_update, location_delete, country_del_err, country_exist, nothing_updated,
	city_create, city_update, city_delete, city_has_route, route_create, route_delete, route_has_service,
	city_exist, city_exist_err, country_exist_err, nothing_deleted
} = require("../../utils/resMessage");

let pageSize = 15;

class LocationController {

	static async getCountries(req, res, next) {
		try {
			const {page = 1, sortKey = 'id', sort = "true", i = '', s = ''} = req.query;
			await Validate(req.query, {
				page: 'integer|min:0',
				sortKey: 'string',
				sort: 'boolean',
				i: 'string',
				s: 'string',
			})

			let filter = {};
			if (s){
				filter.name = {$like: `${ s }%`};
			}

			const {limit, offset} = getPagination(page, pageSize);

			await Country.findAndCountAll({
				where: [filter],
				offset: offset,
				limit: limit,
				distinct: true,
				order: [
					[sortKey ? i ? sortKey + '.' + [i] : sortKey : 'id', sort === "true" ? 'ASC' : 'DESC'],
				],
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

	static async getCountry(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			})

			const result = await Country.findByPk(id);

			const country = successHandler('ok', result || [])
			return res.json(country);
		} catch (e) {
			next(e);
		}
	}

	static async getCites(req, res, next) {
		try {
			const {page = 1, sortKey = 'id', sort = "true", i = '', s = ""} = req.query;
			await Validate(req.query, {
				page: 'integer|min:0',
				sortKey: 'string',
				sort: 'boolean',
				i: 'string',
				s: 'string',
			})

			let filter = {};
			if (s){
				filter.name = {$like: `${ s }%`};
			}

			const {limit, offset} = getPagination(page, pageSize);

			await City.findAndCountAll({
				where: [filter],
				include: [{
					model: Country,
					as: 'country',
					required: false,
				}],
				offset: offset,
				limit: limit,
				distinct: true,
				order: [
					[sortKey ? i ? sortKey + '.' + [i] : sortKey : 'id', sort === "true" ? 'ASC' : 'DESC'],
				],
			}).then(async (data) => {
				const result = getPagingData(data, page, limit);
				const city = successHandler('ok', result || [])
				return res.json(city);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async getCity(req, res, next) {
		try {
			const {id} = req.query;
			await Validate(req.query, {
				id: 'required|integer|min:0',
			})

			const result = await City.findOne({
				where: {id},
				include: [{
					model: Country,
					as: 'country',
					required: false,
				}],
				distinct: true,
			});

			const city = successHandler('ok', result || [])
			return res.json(city);
		} catch (e) {
			next(e);
		}
	}

	static async getRoute(req, res, next) {
		try {
			const {page = 1, sortKey = 'id', sort = "true", s = ''} = req.query;
			await Validate(req.query, {
				page: 'integer|min:0',
				sortKey: 'string',
				sort: 'boolean',
				s: 'string',
			})

			const {limit, offset} = getPagination(page, pageSize);

			let filter = {};
			if (s){
				filter['$or'] = [
					{'$routesTo.name$': {$like: `${ s }%`}},
					{'$routesFrom.name$': {$like: `${ s }%`}},
				]
			}
			await Route.findAndCountAll({
				where: [filter],
				include: [{
					model: City,
					as: 'routesTo',
					required: false,
				}, {
					model: City,
					as: 'routesFrom',
					required: false,
				}],
				offset: offset,
				limit: limit,
				distinct: true,
				order: [
					[sortKey ? sortKey : 'id', sort === "true" ? 'ASC' : 'DESC'],
				],
			}).then(async (data) => {
				const result = getPagingData(data, page, limit);
				const route = successHandler('ok', result || [])
				return res.json(route);
			}).catch((err) => {
				return res.status(500).json({errors: err.message});
			});
		} catch (e) {
			next(e);
		}
	}

	static async createCountry(req, res, next) {
		try {
			const {name, coords} = req.body;
			await Validate(req.body, {
				name: 'string|required|regex:[a-zA-Z ]$',
				coords: 'array|required|latLong|length:2',
			})

			const country = await Country.findOne({where: {name}});
			if (!_.isEmpty(country)){
				const error = errorHandler(country_exist);
				return res.json(error);
			}

			const location = await Country.create({name, coords});

			const result = successHandler(location_create, location || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async createCity(req, res, next) {
		try {
			const {name, coords, countryId, isCanTakePassengers} = req.body;
			await Validate(req.body, {
				name: 'string|required|regex:[a-zA-Z ]$',
				coords: 'array|required|latLong|length:2',
				countryId: 'integer|required|min:0',
				isCanTakePassengers: 'boolean',
			})

			const cityExist = await City.findOne({where: {name}});

			if (!_.isEmpty(cityExist)){
				const error = errorHandler(city_exist);
				return res.json(error);
			}

			const city = await City.create({
				name,
				coords,
				countryId: +countryId,
				isCanTakePassengers: isCanTakePassengers ? isCanTakePassengers : true
			});

			const result = successHandler(city_create, city || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async createRoute(req, res, next) {
		try {
			const {to, from} = req.body;
			await Validate(req.body, {
				to: 'integer|required|min:0',
				from: 'integer|required|min:0',
			})

			const cityTo = await City.findByPk(to);
			const cityFrom = await City.findByPk(from);
			if (!cityTo || !cityFrom){
				const error = errorHandler(city_exist_err)
				return res.json(error);
			}

			const route = await Route.create({to: +to, from: +from});

			const result = successHandler(route_create, route || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateCountry(req, res, next) {
		try {
			const {id, name, coords} = req.body;
			await Validate(req.body, {
				id: 'required|integer|min:0',
				name: 'string|regex:[a-zA-Z ]$',
				coords: 'array|latLong|length:2',
			})

			let toUpdate = {};
			if (name){
				toUpdate.name = name;
				const country = await Country.findOne({where: {name}});
				if (!_.isEmpty(country)){
					const error = errorHandler(country_exist);
					return res.json(error);
				}
			}
			if (coords){
				toUpdate.coords = coords;
			}

			const location = await Country.update({...toUpdate}, {where: {id}});

			const result = location[0] === 0 ? errorHandler(nothing_updated) : successHandler(location_update)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async updateCity(req, res, next) {
		try {
			const {id, name, coords, isCanTakePassengers, countryId} = req.body;
			await Validate(req.body, {
				id: 'required|integer|min:0',
				name: 'string|regex:[a-zA-Z ]$',
				coords: 'array|latLong|length:2',
				isCanTakePassengers: 'boolean',
			})

			let toUpdate = {};
			if (name){
				const cityExist = await City.findOne({where: {name}});
				if (!_.isEmpty(cityExist)){
					const error = errorHandler(city_exist);
					return res.json(error);
				}
				toUpdate.name = name;
			}
			if (countryId){
				const countryExist = await Country.findOne({where: {id: countryId}});
				if (_.isEmpty(countryExist)){
					const error = errorHandler(country_exist_err);
					return res.json(error);
				}
				toUpdate.countryId = +countryId;
			}
			if (coords){
				toUpdate.coords = coords;
			}
			if (isCanTakePassengers){
				toUpdate.isCanTakePassengers = isCanTakePassengers;
			}

			const city = await City.update({...toUpdate}, {where: {id}});

			const result = city[0] === 0 ? errorHandler(nothing_updated) : successHandler(city_update, city || [])
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteCountry(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const city = await City.findAll({
				where: {countryId: id},
			});

			if (!_.isEmpty(city)){
				const error = errorHandler(country_del_err, city);
				return res.json(error);
			}

			const location = await Country.destroy({
				where: {id},
				limit: 1
			});

			const result = location === 0 ? errorHandler(nothing_deleted) : successHandler(location_delete, location)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteCity(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const route = await Route.findAll({
				where: {
					$or: {
						to: id,
						from: id,
					}
				},
				include: [
					{
						model: City,
						as: 'routesTo',
						required: false,
					}, {
						model: City,
						as: 'routesFrom',
						required: false,
					},
				]
			});

			if (!_.isEmpty(route)){
				const error = errorHandler(city_has_route, route);
				return res.json(error);
			}

			const city = await City.destroy({
				where: {id},
				limit: 1
			});

			const result = city === 0 ? errorHandler(nothing_deleted) : successHandler(city_delete, city)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	static async deleteRoute(req, res, next) {
		try {
			const {id} = req.params;
			await Validate(req.params, {
				id: 'required|integer|min:0',
			})

			const service = await Service.findAll({
				where: {routeId: id},
			});

			if (!_.isEmpty(service)){
				const error = errorHandler(route_has_service, service);
				return res.json(error);
			}

			const route = await Route.destroy({
				where: {id},
				limit: 1
			});

			const result = route === 0 ? errorHandler(nothing_deleted) : successHandler(route_delete, route)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = LocationController;
