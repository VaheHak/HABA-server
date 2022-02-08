const express = require('express');
const router = express.Router();

// Controllers
const ServiceController = require('../../controllers/admin/ServiceController');
const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");

//GET
router.get('/service', userType['validateOperator'], xApiKey, ServiceController.getServices);
router.get('/single/service', userType['validateOperator'], xApiKey, ServiceController.getService);
router.get('/ticket', userType['validateOperator'], xApiKey, ServiceController.getTickets);
router.get('/single/ticket', userType['validateOperator'], xApiKey, ServiceController.getTicket);

//POST
router.post('/service', userType['validateAdmin'], xApiKey, ServiceController.createService);
router.post('/ticket', userType['validateOperator'], xApiKey, ServiceController.createTicket);

//PUT
router.put('/service', userType['validateAdmin'], xApiKey, ServiceController.updateService);
router.put('/ticket', userType['validateOperator'], xApiKey, ServiceController.updateTicket);

//DELETE
router.delete('/service/:id', userType['validateAdmin'], xApiKey, ServiceController.deleteService);
router.delete('/ticket/:id', userType['validateAdmin'], xApiKey, ServiceController.deleteTicket);
router.delete('/ticket_detail/:id', userType['validateAdmin'], xApiKey, ServiceController.deleteTicketDetail);

module.exports = router;
