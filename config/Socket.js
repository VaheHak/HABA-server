const socketIo = require('socket.io');
const socketIoJwt = require('socketio-jwt');
const _ = require('lodash');
const Users = require("../models/user");
const Driver = require("../models/driver");
const {UserTypes} = require("../utils/enums");
const {getPagination, getPagingData} = require("./pagination");
const {literal} = require("sequelize");
const DeliveryService = require("../models/deliveryService");

const {JWT_SECRET} = process.env;
const pageSize = 15;
let users = [];
let drivers = [];
let driverFilters = {page: 1};

class Socket {

	static init(server) {
		this.io = socketIo(server, {
			cors: {
				origin: ["http://46.101.57.223", "http://46.101.57.223/socket.io", "http://localhost:3000", "http://192.168.100.32:3000", "http://localhost:3001", 'https://console.habaexpress.com'],
				methods: ['GET', 'POST'],
				credentials: true,
				autoConnect: true,
			},
			pingInterval: 25000,
			pingTimeout: 180000,
			transports: ['websocket', 'polling'],
			allowEIO3: true,
			serveClient: true,
			cookie: {
				name: "haba", httpOnly: false, secure: true
			}
		})

		this.io.use(socketIoJwt.authorize({secret: JWT_SECRET, handshake: true}));

		this.io.on('connection', async (client) => {
			const {userId, role} = client['decoded_token'];
			const {id: socketId} = client;
			users.push({socketId, userId: +userId, role});
			if (+role === +UserTypes.driver){
				drivers.push({socketId, userId: +userId, role});
			}
			this.activeUsers();
			await this.activeDrivers(driverFilters);
			this.partnerDrivers();

			client.on('send-coords', async (data) => {
				try {
					if (!data || !_.isObject(data)) return false;
					const driver = await Driver.update({
						coords: data.coords,
					}, {where: {id: +data.id}})
					if (+_.get(driver, 0) === 1 && data){
						await this.newCoords(data.id, data.coords)
					}
				} catch (err) {
					console.warn(err)
				}
			})

			client.on('get-drivers', async (data) => {
				try {
					if (data){
						await this.activeDrivers(data);
						if (data.page) _.set(driverFilters, "page", data.page)
						if (data.type) _.set(driverFilters, "type", data.type)
					}
				} catch (err) {
					console.warn(err)
				}
			})

			client.on('send-status', async (data) => {
				try {
					if (!data || !_.isObject(data)) return false;
					let update = {};
					if (data.status){
						update.status = data.status.toString();
						if (+data.status === 1){
							update.pendingDate = new Date();
							update.tookDate = null;
							update.doneDate = null;
						}
						if (+data.status === 2){
							update.tookDate = new Date();
							update.doneDate = null;
						}
						if (+data.status === 3){
							update.doneDate = new Date();
						}
					}
					const deliveryService = await DeliveryService.update({...update}, {where: {id: data.id}, silent: true});
					if (+_.get(deliveryService, 0) === 1 && data){
						await this.newStatus(data.id)
					}
				} catch (err) {
					console.warn(err)
				}
			})

			client.on('disconnect', async () => {
				users = users.filter((u) => u.socketId !== socketId)
				const id = _.find(drivers, ["socketId", socketId])
				drivers = drivers.filter((u) => u.socketId !== socketId)
				this.activeUsers();
				await this.activeDrivers(driverFilters);
				if (id) this.deleteDriver(id.userId);
				this.partnerDrivers();

				await Users.update({
					lastVisit: new Date(), active: 'off',
				}, {
					where: {
						id: userId,
					}, silent: true,
				})
			})

			await Users.update({
				lastVisit: null, active: 'on',
			}, {
				where: {id: userId}, silent: true,
			})
		})

	}

	static activeUsers() {
		const user = _.uniq(_.map(users ? users : [], (u) => u.userId))
		this.io.emit('active-users', user);
	}

	static partnerDrivers() {
		const driversId = _.uniq(_.map(drivers ? drivers : [], (u) => u.userId))
		this.io.emit('partner-drivers', driversId);
	}

	static async activeDrivers(d) {
		if (!d) return false
		const driversId = _.uniq(drivers.map((u) => u.userId));
		const {limit, offset} = getPagination(d.page ? d.page : 1, pageSize);
		let filter = {};
		if (driversId && _.isArray(driversId)) filter.userId = driversId;
		if (d.type && _.isNumber(d.type)) filter.type = literal(`JSON_CONTAINS(type, '[${ d.type }]')`);
		await Driver.findAndCountAll({
			where: [filter], include: [{
				model: Users,
				as: 'driverUser',
				required: false,
				attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
			}], offset: offset, limit: limit, distinct: true,
		}).then((data) => {
			const result = getPagingData(data, d.page ? d.page : 1, limit);
			this.io.emit('active-drivers', result || {})
		}).catch((err) => {
			this.io.emit('active-drivers', err)
		});
	}

	static deleteDriver(id) {
		if (id){
			this.io.emit('delete-driver', id)
		}
	}

	static newCoords(driverId, coords) {
		users.forEach((u) => {
			if ([+UserTypes.admin, +UserTypes.operator, +UserTypes.partner].includes(+u.role)){
				this.io.to(u.socketId).emit('new-coords', {driverId, coords})
			}
		})
	}

	static newStatus(id) {
		users.forEach(async (u) => {
			if ([+UserTypes.partner].includes(+u.role)){
				const order = await DeliveryService.findOne({
					where: id, include: [{
						model: Driver, as: 'deliveryServiceDriver', required: false, include: [{
							model: Users,
							as: 'driverUser',
							required: false,
							attributes: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'],
						}]
					}]
				});
				if (order){
					this.io.to(u.socketId).emit('new-status', order);
				}
			}
		})
	}

	static emit(key, message) {
		users.forEach((u) => {
			if ([+UserTypes.admin, +UserTypes.operator].includes(+u.role)){
				this.io.to(u.socketId).emit(key, message)
			}
		})
	}
}

module.exports = Socket;
