const express = require('express');
const router = express.Router();

// Controllers
const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");
const ServiceController = require("../../controllers/user/ServiceController");

//GET
router.get('/user/service/dates', userType['validateUser'], xApiKey, ServiceController.getServiceDates);
router.get('/user/service/passengers', userType['validateUser'], xApiKey, ServiceController.getServicePassengers);
router.get('/user/delivery/transport', userType['validateUser'], xApiKey, ServiceController.getDeliveryTransports);
router.get('/user/service/weights', userType['validateUser'], xApiKey, ServiceController.getServiceWeights);

//POST
router.post('/user/ticket', userType['validateUser'], xApiKey, ServiceController.createTicket);

module.exports = router;
