const passport = require("passport");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { PUBLIC_ROUTES } = require("../utility/constants");
const UserModel = require("../models/user.model");

const verifyCallback =
  (req, resolve, reject, requiredRights) => async (err, user, info) => {
    if (isPublicRoute(req.url) || user.role === "superAdmin") {
      req.user = user;
      resolve();
    }
    if (err || info || !user) {
      return reject(
        new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
      );
    }
    req.user = user;

    if (requiredRights.length) {
      const userDetails = await UserModel.findById(user._id).select(
        "permissions"
      );
      const permissions = userDetails?.permissions || [];
      const hasPermission = requiredRights.every((requiredRight) =>
        permissions.includes(requiredRight)
      );
      if (!hasPermission)
        return reject(
          new ApiError(httpStatus.FORBIDDEN, "Insufficient Permission Scope")
        );
    }
    resolve();
  };

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        "jwt",
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

const isPublicRoute = (requestedUrl) => {
  const isPublicRoute = Object.values(PUBLIC_ROUTES).some((route) =>
    requestedUrl?.toUpperCase().includes(route)
  );
  return isPublicRoute;
};

const superAdminCheck = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      next(err);
    }
    if (!user) {
      next(new Error("Authentication failed"));
    }
    const userAdmin = user;
    if (userAdmin && userAdmin.role === "superAdmin") {
      req.user = userAdmin;
      next();
    } else {
      next(new Error("You do not have permission to access this resource"));
    }
  })(req, res, next);
};

module.exports = {
  auth,
  superAdminCheck,
};
