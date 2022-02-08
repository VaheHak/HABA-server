const express = require('express');
const router = express.Router();

// Controllers
const LocationController = require('../../controllers/admin/LocationController');
const userType = require("../../middlewares/permission");
const xApiKey = require("../../middlewares/apiKey");

//GET
router.get('/country', userType['validateOperator'], xApiKey, LocationController.getCountries);
router.get('/single_country', userType['validateOperator'], xApiKey, LocationController.getCountry);
router.get('/city', userType['validateOperator'], xApiKey, LocationController.getCites);
router.get('/single_city', userType['validateOperator'], xApiKey, LocationController.getCity);
router.get('/route', userType['validateOperator'], xApiKey, LocationController.getRoute);

//POST
router.post('/country', userType['validateAdmin'], xApiKey, LocationController.createCountry);
router.post('/city', userType['validateAdmin'], xApiKey, LocationController.createCity);
router.post('/route', userType['validateAdmin'], xApiKey, LocationController.createRoute);

//PUT
router.put('/country', userType['validateAdmin'], xApiKey, LocationController.updateCountry);
router.put('/city', userType['validateAdmin'], xApiKey, LocationController.updateCity);

//DELETE
router.delete('/country/:id', userType['validateAdmin'], xApiKey, LocationController.deleteCountry);
router.delete('/city/:id', userType['validateAdmin'], xApiKey, LocationController.deleteCity);
router.delete('/route/:id', userType['validateOperator'], xApiKey, LocationController.deleteRoute);

module.exports = router;
