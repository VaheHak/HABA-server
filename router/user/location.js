const express = require('express');
const router = express.Router();

const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");
// Controllers
const LocationController = require('../../controllers/user/LocationController');

//GET
router.get('/user/countries', userType['validateUser'], xApiKey, LocationController.userCountries);
router.get('/user/cities', userType['validateUser'], xApiKey, LocationController.userCities);


module.exports = router;
