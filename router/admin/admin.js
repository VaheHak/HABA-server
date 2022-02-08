const express = require('express');
const router = express.Router();
const upload = require('../../config/fileValidation');

const userType = require("../../middlewares/permission");
const {limiter, SpeedLimiter} = require("../../config/limiters");
const xApiKey = require("../../middlewares/apiKey");
const fileUpload = upload({
  'image/webp': '.webp',
  'image/png': '.png',
  'image/jpeg': '.jpg',
}).single('image');

// Controllers
const AdminController = require('../../controllers/admin/AdminController');

//POST
router.post('/admin/login', limiter, SpeedLimiter, xApiKey, AdminController.adminLogin);
router.post('/admin/checkAdminLogin', limiter, SpeedLimiter, xApiKey, AdminController.checkAdminLogin);
router.post('/reset/token', limiter, SpeedLimiter, xApiKey, AdminController.resetToken);
router.post('/user', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, AdminController.createUser);
router.post('/user/driver', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, AdminController.createDriver);
router.post('/partner', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, fileUpload, AdminController.createPartner);

//GET
router.get('/profile', userType['validateOperator'], xApiKey, AdminController.profile);
router.get('/user', userType['validateOperator'], xApiKey, AdminController.getUsers);
router.get('/single_user', userType['validateOperator'], xApiKey, AdminController.getUser);
router.get('/user/driver', userType['validateOperator'], xApiKey, AdminController.getDrivers);
router.get('/user/single/driver', userType['validateOperator'], xApiKey, AdminController.getDriver);
router.get('/partner', userType['validateOperator'], xApiKey, AdminController.getPartners);
router.get('/single/partner', userType['validateOperator'], xApiKey, AdminController.getPartner);

//PUT
router.put('/user', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, AdminController.updateUser);
router.put('/user/driver', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, AdminController.updateDriver);
router.put('/partner', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, fileUpload, AdminController.updatePartner);

//DELETE
router.delete('/user/:id', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, AdminController.deleteUser);
router.delete('/user/driver/:id', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, AdminController.deleteDriver);
router.delete('/partner/:id', userType['validateOperator'], limiter, SpeedLimiter, xApiKey, AdminController.deletePartner);

module.exports = router;
