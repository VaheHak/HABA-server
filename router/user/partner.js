const express = require('express');
const router = express.Router();

const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");

// Controllers
const PartnerController = require('../../controllers/user/PartnerController');

//GET
router.get('/partners', userType['validateUser'], xApiKey, PartnerController.getPartners);
router.get('/partner/drivers', userType['validatePartner'], xApiKey, PartnerController.getPartnerDrivers);

module.exports = router;
