const express = require('express');
const router = express.Router();

// Controllers
const StatisticController = require("../../controllers/partner/StatisticController");
const userType = require("../../middlewares/permission");
const xApiKey = require("../../middlewares/apiKey");

//GET
router.get('/partner/statistics', userType['validatePartner'], xApiKey, StatisticController.getStatistics);

module.exports = router;
