const express = require('express');
const router = express.Router();

// Controllers
const StatisticController = require('../../controllers/admin/StatisticController');
const userType = require("../../middlewares/permission");
const xApiKey = require("../../middlewares/apiKey");

//GET
router.get('/statistics', userType['validateOperator'], xApiKey, StatisticController.getStatistics);

module.exports = router;
