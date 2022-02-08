const httpError = require("http-errors");
const jwt = require("jsonwebtoken");
const {errorHandler} = require("../utils/responseHandlers");
const {UserTypes} = require("../utils/enums");
const {not_auth, forbidden} = require("../utils/resMessage");

const {JWT_SECRET} = process.env;

function permit(...roles) {
  return function role(req, res, next) {
    if (req.method === 'OPTIONS'){
      next();
    }
    try {
      const {authorization} = req.headers;

      if (authorization){
        const token = authorization.replace('Bearer ', '');
        jwt.verify(token, JWT_SECRET, (err, data) => {
          if (!err){
            if (roles.includes(+data.role)){
              next();
              return;
            }
            const error = errorHandler(forbidden);
            return res.status(200).json(error);
          }
          throw httpError(401, not_auth);
        });
      } else{
        throw httpError(401, not_auth);
      }
    } catch (e) {
      next(e);
    }
  };
}

module.exports = {
  validateAdmin: permit(UserTypes.admin),
  validateOperator: permit(UserTypes.admin, UserTypes.operator),
  validateUser: permit(UserTypes.partner, UserTypes.driver, UserTypes.client, UserTypes.admin, UserTypes.operator),
  validateDriver: permit(UserTypes.driver),
  validatePartner: permit(UserTypes.partner),
}
