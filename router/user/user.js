const express = require('express');
const router = express.Router();

const {limiter, SpeedLimiter} = require("../../config/limiters");
const xApiKey = require("../../middlewares/apiKey");

// Controllers
const UserController = require('../../controllers/user/UserController');

//POST
router.post('/user/signin', limiter, SpeedLimiter, xApiKey, UserController.userLogin);
router.post('/refresh/token', limiter, SpeedLimiter, xApiKey, UserController.resetToken);
router.post('/user/signup', limiter, SpeedLimiter, xApiKey, UserController.userRegister);
router.post('/user/signup/check', limiter, SpeedLimiter, xApiKey, UserController.checkRegistration);
router.post('/signup/setPassword', limiter, SpeedLimiter, xApiKey, UserController.setPassword);
router.post('/forgot', limiter, SpeedLimiter, xApiKey, UserController.forgotPassword);
router.post('/forgot/check', limiter, SpeedLimiter, xApiKey, UserController.forgotCheckPassword);
router.post('/forgot/resetPassword', limiter, SpeedLimiter, xApiKey, UserController.forgotResetPassword);

module.exports = router;
