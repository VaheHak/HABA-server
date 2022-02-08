const {successHandler} = require("../../utils/responseHandlers");
const Validate = require("../../config/validate");
const Users = require("../../models/user");
const {getPagination, getPagingData} = require("../../config/pagination");
const Driver = require("../../models/driver");
const DriverState = require("../../models/driverState");
const Car = require("../../models/car");
const Partner = require("../../models/partner");
const {error_message_page, error_message_id} = require("../../utils/resMessage");
const PartnerBranch = require("../../models/partnerBranch");

const pageSize = 15;

class PartnerController {

  static async getPartners(req, res, next) {
    try {
      const {page = 1, id} = req.body;
      const errors = await Validate(req.body, {
        page: 'integer|min:0',
        id: 'integer|min:0',
      }, void 0, true, void 0, {page: error_message_page, id: error_message_id})
      if (errors){
        return res.status(200).json(errors);
      }

      let filter = {};
      if (id){
        filter.id = id;
      }

      const {limit, offset} = getPagination(page, pageSize);

      await Partner.findAndCountAll({
        where: [filter],
        include: [{
          model: Users,
          as: 'partnerUser',
          required: false,
        }, {
          model: PartnerBranch,
          as: 'partnerBranches',
          required: false,
        }],
        offset: offset,
        limit: limit,
        distinct: true,
      }).then((data) => {
        const result = getPagingData(data, page, limit);
        const partner = successHandler('ok', result || [])
        return res.json(partner);
      }).catch((err) => {
        return res.status(500).json({errors: err.message});
      });
    } catch (e) {
      next(e);
    }
  }

  static async getPartnerDrivers(req, res, next) {
    try {
      const {page = 1} = req.body;
      const errors = await Validate(req.body, {
        page: 'integer|min:0',
      }, void 0, true, void 0, {page: error_message_page})
      if (errors){
        return res.status(200).json(errors);
      }

      const partner = await Partner.findOne({where: {userId: req.userId}});
      let filter = {};
      if (partner){
        filter.id = partner.id;
      }

      const {limit, offset} = getPagination(page, pageSize);

      await Driver.findAndCountAll({
        include: [{
          model: Users,
          as: 'driverUser',
          required: false,
        }, {
          model: DriverState,
          as: 'stateDriver',
          required: false,
        }, {
          model: Car,
          as: 'driverCars',
          required: false,
        }, {
          model: Partner,
          as: 'driverPartner',
          required: true,
          where: [filter],
        }],
        offset: offset,
        limit: limit,
        distinct: true,
      }).then((data) => {
        const result = getPagingData(data, page, limit);
        const country = successHandler('ok', result || [])
        return res.json(country);
      }).catch((err) => {
        return res.status(500).json({errors: err.message});
      });
    } catch (e) {
      next(e);
    }
  }

}

module.exports = PartnerController;
