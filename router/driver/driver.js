const express = require('express');
const router = express.Router();

const {limiter, SpeedLimiter} = require("../../config/limiters");
const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");

// Controllers
const DriverController = require('../../controllers/driver/DriverController');

//POST
router.post('/driver/signin', limiter, SpeedLimiter, xApiKey, DriverController.driverLogin);
router.post('/driver/forgot', limiter, SpeedLimiter, xApiKey, DriverController.forgotPassword);
router.post('/driver/forgot/check', limiter, SpeedLimiter, xApiKey, DriverController.forgotCheckCode);
router.post('/driver/forgot/resetPassword', limiter, SpeedLimiter, xApiKey, DriverController.forgotResetPassword);
router.post('/driver/device', userType['validateDriver'], xApiKey, DriverController.postDevice);

//GET
router.get('/driver/delivery/orders', userType['validateDriver'], xApiKey, DriverController.getDeliveryOrders);
router.get('/driver/delivery/order', userType['validateDriver'], xApiKey, DriverController.getDeliveryOrder);
router.get('/driver/user/info', userType['validateDriver'], xApiKey, DriverController.getProfile);

//PUT
router.put('/driver/order', userType['validateDriver'], xApiKey, DriverController.updateDeliveryOrderStatus);
router.put('/driver/coords', userType['validateDriver'], xApiKey, DriverController.updateCoords);

//DELETE
router.delete('/driver/device', userType['validateDriver'], xApiKey, DriverController.deleteDevice);

module.exports = router;
