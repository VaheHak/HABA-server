const express = require('express');
const router = express.Router();

// Controllers
const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");
const DeliveryServiceController = require("../../controllers/user/DeliveryServiceController");

//GET
router.get('/delivery/orders', userType['validateUser'], xApiKey, DeliveryServiceController.getDeliveryOrders);
router.get('/delivery/order', userType['validateUser'], xApiKey, DeliveryServiceController.getDeliveryOrder);

//POST
router.post('/delivery/order', userType['validateUser'], xApiKey, DeliveryServiceController.createDeliveryOrders);

module.exports = router;
