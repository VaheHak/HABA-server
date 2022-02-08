const express = require('express');
const router = express.Router();

const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");

// Controllers
const ClientController = require('../../controllers/partner/ClientController');

//POST
router.post('/partner/client', userType['validatePartner'], xApiKey, ClientController.postClient);

//GET
router.get('/partner/clients', userType['validatePartner'], xApiKey, ClientController.getClients);
router.get('/partner/client', userType['validatePartner'], xApiKey, ClientController.getClient);

//PUT
router.put('/partner/client', userType['validatePartner'], xApiKey, ClientController.updateClient);

//DELETE
router.delete('/partner/client/:id', userType['validatePartner'], xApiKey, ClientController.deleteClient);

module.exports = router;
