const errorHandler = (message, data) => {
  return {
    status: false,
    message,
    data: data ? data : null,
  };
};

const successHandler = (message, data) => {
  return {
    status: true,
    message,
    data: data ? data : null,
  };
};

module.exports = {errorHandler, successHandler};
