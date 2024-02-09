const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const { PUBLIC_ROUTES } = require("../utility/constants");

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if(isPublicRoute(req.url)){
    req.user = user;
    resolve();
  }
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user._id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  resolve();
};

const auth = (...requiredRights) => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

const isPublicRoute = (requestedUrl) => {
  const isPublicRoute = PUBLIC_ROUTES.some(route => requestedUrl?.toUpperCase().includes(route));
  return isPublicRoute;
}

const superAdminCheck = (req, res, next) => {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
      if (err) {
        next(err);
      }
      if (!user) {
         next(new Error('Authentication failed'));
      }
      const userAdmin = user;
      if (userAdmin && userAdmin.role === 'superAdmin') {
        req.user = userAdmin;
        next();
      } else {
        next(new Error('You do not have permission to access this resource'));
      }
    })(req, res, next);
};


module.exports = {
  auth,
  superAdminCheck 
};
