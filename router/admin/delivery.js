const express = require('express');
const router = express.Router();

// Controllers
const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");
const DeliveryController = require("../../controllers/admin/DeliveryController");

//GET
router.get('/delivery/transports', userType['validateOperator'], xApiKey, DeliveryController.getDeliveryTransports);
router.get('/delivery/transport', userType['validateOperator'], xApiKey, DeliveryController.getDeliveryTransport);
router.get('/delivery/services', userType['validateOperator'], xApiKey, DeliveryController.getServices);
router.get('/delivery/service', userType['validateOperator'], xApiKey, DeliveryController.getService);

//POST
router.post('/delivery/transport', userType['validateOperator'], xApiKey, DeliveryController.addDeliveryTransport);
router.post('/delivery/service', userType['validateOperator'], xApiKey, DeliveryController.createService);

//PUT
router.put('/delivery/transport', userType['validateOperator'], xApiKey, DeliveryController.updateDeliveryTransport);
router.put('/delivery/service', userType['validateOperator'], xApiKey, DeliveryController.updateService);

//DELETE
router.delete('/delivery/transport/:id', userType['validateOperator'], xApiKey, DeliveryController.deleteDeliveryTransport);
router.delete('/delivery/service/:id', userType['validateOperator'], xApiKey, DeliveryController.deleteService);

module.exports = router;
