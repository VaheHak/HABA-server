const {Sequelize, Op} = require('sequelize');
const Promise = require('bluebird');
const HttpError = require('http-errors');
const sequelizeTransforms = require('sequelize-transforms');

const {DB_NAME, DB_PASSWORD, DB_USER, DB_HOST, DB_PORT} = process.env;

Sequelize.Promise = Promise;

const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
};

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  operatorsAliases,
  pool: {
    max: 5,
    min: 0,
    idle: 15000,
    acquire: 15000
  },
});
sequelizeTransforms(sequelize);

sequelize
  .authenticate()
  .then(() => {
    console.log('Connected successfully.');
  })
  .catch(err => {
    throw HttpError(500, `Unable to connect to the database: ${ err }`);
  });

module.exports = sequelize;
