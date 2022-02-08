const express = require('express');
const router = express.Router();

const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");
// Controllers
const DeliveryServiceController = require('../../controllers/partner/DeliveryServiceController');

//GET
router.get('/partner/delivery/orders', userType['validatePartner'], xApiKey, DeliveryServiceController.getOrders);
router.get('/partner/delivery/order', userType['validatePartner'], xApiKey, DeliveryServiceController.getOrder);
//POST
router.post('/partner/delivery/orders', userType['validatePartner'], xApiKey, DeliveryServiceController.createOrder);
//PUT
router.put('/partner/delivery/orders', userType['validatePartner'], xApiKey, DeliveryServiceController.updateOrder);
//DELETE
router.delete('/partner/delivery/orders/:id', userType['validatePartner'], xApiKey, DeliveryServiceController.deleteOrder);

module.exports = router;
