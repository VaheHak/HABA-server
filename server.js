const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const compression = require("compression");
const helmet = require("helmet");
const createError = require("http-errors");

const serverHost = require("./middlewares/serverHost");
const headers = require("./middlewares/headers");
const authorization = require("./middlewares/authorization");

const server = express();

server.use(helmet());
server.use(compression());
server.use(logger('dev'));
server.use(express.json());
server.use(express.urlencoded({extended: false}));
server.use(cookieParser());
server.use(express.static(path.join(__dirname, 'public')));
server.use(headers);
server.use(serverHost);
server.use(authorization);
server.set(`trust proxy`, 1);
server.disable('x-powered-by');

server.use("/", require('./router/index'));

server.use((req, res, next) => {
  next(createError(404));
});

server.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  req.app.get('env') === 'development' ?
    res.json({
      status: false,
      message: err.errors ? err.errors : err.message,
      data: null,
    }) : res.json({
      status: false,
      message: err.errors ? err.errors : err.message,
      data: null,
    });
});

module.exports = server;
