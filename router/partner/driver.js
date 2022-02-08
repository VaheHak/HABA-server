const express = require('express');
const router = express.Router();

const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");
// Controllers
const DriverController = require('../../controllers/partner/DriverController');
const upload = require("../../config/fileValidation");
const fileUpload = upload({
	'image/webp': '.webp',
	'image/png': '.png',
	'image/jpeg': '.jpg',
}).single('avatar');

//GET
router.get('/partner/branch/drivers', userType['validatePartner'], xApiKey, DriverController.getDrivers);

//POST
router.post("/partner/send/message", userType['validatePartner'], xApiKey, DriverController.index);
router.post("/partner/driver/create", userType['validatePartner'], xApiKey, fileUpload, DriverController.createDriver);

module.exports = router;
