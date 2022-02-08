const express = require('express');
const router = express.Router();

const admin = require('./admin/admin')
const location = require('./admin/location')
const service = require('./admin/service')
const statistics = require('./admin/statistics')
const delivery = require('./admin/delivery')
const user = require('./user/user')
const deliverService = require('./user/deliverService')
const driver = require('./driver/driver')
const userPartner = require('./user/partner')
const userLocation = require('./user/location')
const userService = require('./user/service')
const partner = require('./partner/partner')
const partnerDelivery = require('./partner/delivery')
const partnerDriver = require('./partner/driver')
const client = require('./partner/client')
const partnerStatistics = require('./partner/statistics')

router.use('/', admin);
router.use('/', location);
router.use('/', service);
router.use('/', statistics);
router.use('/', delivery);
router.use('/', user);
router.use('/', deliverService);
router.use('/', driver);
router.use('/', client);
router.use('/', userPartner);
router.use('/', userLocation);
router.use('/', userService);
router.use('/', partner);
router.use('/', partnerDelivery);
router.use('/', partnerDriver);
router.use('/', partnerStatistics);

module.exports = router;
