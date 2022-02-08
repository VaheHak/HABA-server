const RateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

const limiter = new RateLimit({
  max: 10000,
  windowMs: 15 * 60 * 1000,
  statusCode: 200,
  message: {
    status: false,
    message: "Too Many requests, try again 15 minutes",
    data: null,
  }
});

const SpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: 500,
  maxDelayMs: 20000,
});

module.exports = {limiter, SpeedLimiter};
