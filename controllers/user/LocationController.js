const _ = require("lodash");
const {successHandler} = require("../../utils/responseHandlers");
const {error_message_page, error_message_id,} = require("../../utils/resMessage");
const Validate = require("../../config/validate");
const {getPagination, getPagingData} = require("../../config/pagination");
const City = require("../../models/city");
const Country = require("../../models/country");

const pageSize = 15;

class LocationController {

  static async userCountries(req, res, next) {
    try {
      const {page = 1} = req.body;
      const errors = await Validate(req.body, {
        page: 'integer|min:0',
      }, void 0, true, void 0, {page: error_message_page})
      if (errors){
        return res.status(200).json(errors);
      }

      const {limit, offset} = getPagination(page, pageSize);

      await Country.findAndCountAll({
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

  static async userCities(req, res, next) {
    try {
      const {page = 1, countryId} = req.body;
      const errors = await Validate(req.body, {
        page: 'integer|min:0',
        countryId: 'required|integer|min:0',
      }, void 0, true, void 0, {page: error_message_page, countryId: error_message_id})
      if (errors){
        return res.status(200).json(errors);
      }

      let filter = {};
      if (countryId){
        filter.countryId = countryId;
      }

      const {limit, offset} = getPagination(page, pageSize);

      await City.findAndCountAll({
        where: [filter],
        include: [{
          model: Country,
          as: 'country',
          required: false,
        }],
        offset: offset,
        limit: limit,
        distinct: true,
      }).then((data) => {
        const result = getPagingData(data, page, limit);
        const city = successHandler('ok', result || [])
        return res.json(city);
      }).catch((err) => {
        return res.status(500).json({errors: err.message});
      });
    } catch (e) {
      next(e);
    }
  }

}

module.exports = LocationController;
