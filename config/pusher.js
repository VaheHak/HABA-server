const {NotificationTypes, OsTypes} = require("../utils/deviceEnums");
const axios = require("axios");
const Device = require("../models/device");
const _ = require("lodash");
const {push_notification_fail} = require("../utils/resMessage");
const httpError = require("http-errors");

const {FIREBASE_SERVER_KEY, FIREBASE_SENDERID} = process.env;

notifyInboxMessage = async (inboxMessage, userId) => {
	try {
		const data = {
			type: NotificationTypes['inboxMessage'],
			title: 'New Order',
			description: `New Order from ${ inboxMessage.name }`,
			conversationId: inboxMessage.id,
			branch: inboxMessage.branch,
			message: inboxMessage.message
		};

		return await sendCustomNotificationToUsers(userId, data);
	} catch (err) {
		throw httpError(500, err);
	}
}

notifyMessage = async (inboxMessage, userId) => {
	try {
		const data = {
			type: NotificationTypes['chatMessage'],
			title: 'New message',
			description: `New message from ${ inboxMessage.name }`,
			conversationId: inboxMessage.id,
			branch: inboxMessage.branch,
			message: inboxMessage.message
		};

		await sendCustomNotificationToUsers(userId, data);
	} catch (err) {
		throw httpError(500, err);
	}
}

module.exports = {notifyInboxMessage, notifyMessage};

sendCustomNotificationToUsers = async (userId, data) => {
	try {
		const iosToken = await Device.findOne({
			where: {
				userId: userId, osType: OsTypes['ios'],
			}, attributes: ['deviceToken'],
		});
		const androidToken = await Device.findOne({
			where: {
				userId: userId, osType: OsTypes['android'],
			}, attributes: ['deviceToken'],
		});

		if (iosToken){
			return await sendIOSNotification(iosToken, data);
		}

		if (androidToken){
			return await sendAndroidNotification(androidToken, data);
		}
	} catch (e) {
		throw httpError(500, e);
	}
}

sendAndroidNotification = (token, data) => {
	const objNotification = {
		to: "", topic: "highScores", data: data
	};

	if (token.deviceToken && _.isString(token.deviceToken)){
		objNotification.to = token.deviceToken;

		try {
			return sendNotificationToFireBase(objNotification);
		} catch (e) {
			throw httpError(500, e);
		}
	}
}

sendIOSNotification = (token, data) => {
	const objNotification = {
		to: "", topic: "highScores", notification: {
			...data, body: data.description, badge: 1, 'mutable-content': 1, sound: 'default'
		}
	};

	if (token.deviceToken && _.isString(token.deviceToken)){
		objNotification.to = token.deviceToken;

		try {
			return sendNotificationToFireBase(objNotification);
		} catch (e) {
			throw httpError(500, e);
		}
	}
}

sendNotificationToFireBase = async (data) => {
	try {
		const api = axios.create({
			baseURL: "https://fcm.googleapis.com",
		});

		api.interceptors.request.use((config) => {
			config.headers.Authorization = `key=${ FIREBASE_SERVER_KEY }`;
			config.headers.Sender = `id=${ FIREBASE_SENDERID }`;
			return config;
		}, (error) => {
			return Promise.reject(error);
		})

		const res = await api.post('/fcm/send', data);
		if (res){
			console.log(`Send notification success: ${ res }`);
		}
	} catch (e) {
		if (e.response){
			throw httpError(500, {message: e.response.statusText});
		} else{
			throw httpError(500, {message: push_notification_fail});
		}
	}
}
