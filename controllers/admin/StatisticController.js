const _ = require("lodash");
const Validate = require("../../config/validate");
const ServiceDetails = require("../../models/serviceDetails");
const moment = require('moment');
const Passenger = require("../../models/passenger");
const Cargo = require("../../models/cargo");
const {successHandler} = require("../../utils/responseHandlers");
const Users = require("../../models/user");
const Driver = require("../../models/driver");
const Partner = require("../../models/partner");

class StatisticController {

  static async getStatistics(req, res, next) {
    try {
      const {
        toStartDate, fromStartDate, cargoToStartDate, cargoFromStartDate,
      } = req.query;
      await Validate(req.query, {
        toStartDate: 'iso8601',
        fromStartDate: 'iso8601',
        cargoToStartDate: 'iso8601',
        cargoFromStartDate: 'iso8601',
      })

      let filter = {};
      if (fromStartDate || toStartDate){
        filter.createdAt = {
          $gte: fromStartDate ? new Date(moment(fromStartDate).format('YYYY-MM-DD 00:00:00')) : 0,
          $lte: toStartDate ? new Date(moment(toStartDate).format('YYYY-MM-DD 23:59:59')) : new Date(),
        };
      }

      let cargoFilter = {};
      if (cargoFromStartDate || cargoToStartDate){
        cargoFilter.createdAt = {
          $gte: cargoFromStartDate ? new Date(moment(cargoFromStartDate).format('YYYY-MM-DD 00:00:00')) : 0,
          $lte: cargoToStartDate ? new Date(moment(cargoToStartDate).format('YYYY-MM-DD 23:59:59')) : new Date(),
        };
      }

      const kg = await Cargo.sum('kg');
      const passengerSeat = await Passenger.sum('passengerSeat');
      const intercityPrice = await ServiceDetails.sum('price', {where: {type: 1}});
      const cargoPrice = await ServiceDetails.sum('price', {where: {type: 2}});
      const users = await Users.count();
      const drivers = await Driver.count();
      const partners = await Partner.count();
      const cargo = await Cargo.findAll({
        where: {...cargoFilter},
        attributes: ['id', 'kg', 'createdAt'],
        order: [['createdAt', 'ASC']],
      });
      const intercity = await Passenger.findAll({
        where: {...filter},
        attributes: ['id', 'passengerSeat', 'createdAt'],
        order: [['createdAt', 'ASC']],
      });

      const result = successHandler("ok", {
        kg, passengerSeat, intercityPrice, cargoPrice, users,
        drivers, partners, intercity: intercity || [], cargo: cargo || [],
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = StatisticController;
