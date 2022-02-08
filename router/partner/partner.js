const express = require('express');
const router = express.Router();

const {limiter, SpeedLimiter} = require("../../config/limiters");
const xApiKey = require("../../middlewares/apiKey");
const userType = require("../../middlewares/permission");
// Controllers
const PartnerController = require('../../controllers/partner/PartnerController');

//GET
router.get('/partner/profile', userType['validatePartner'], xApiKey, PartnerController.getProfile);
router.get('/partner/branches', userType['validateUser'], xApiKey, PartnerController.getBranches);

//POST
router.post('/partner/signin', limiter, SpeedLimiter, xApiKey, PartnerController.partnerLogin);
router.post('/partner/forgot', limiter, SpeedLimiter, xApiKey, PartnerController.forgotPassword);
router.post('/partner/forgot/check', limiter, SpeedLimiter, xApiKey, PartnerController.forgotCheckCode);
router.post('/partner/forgot/resetPassword', limiter, SpeedLimiter, xApiKey, PartnerController.forgotResetPassword);

module.exports = router;
