const _ = require('lodash');

const getPagination = (page, size) => {
  const limit = size ? +size : 15;
  const offset = page ? (page - 1) * limit : 0;

  return {limit, offset};
};

const getPagingData = (data, page, limit) => {
  const {count: totalItems, rows: array} = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);

  return {totalItems, totalPages, currentPage, array};
};

const subQueryPaging = (data, page, limit) => {
  const {count: totalItems, rows} = data;
  const array = _.filter(rows, (v, k) => {
    return k >= (page * limit) - limit && k < page * limit
  });
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);

  return {totalItems, totalPages, currentPage, array};
};

module.exports = {getPagination, getPagingData, subQueryPaging};
