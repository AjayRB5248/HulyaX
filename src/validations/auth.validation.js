const Joi = require("joi");
const { password, mobileNumberValidator } = require("./custom.validation");
const { roles } = require("../config/roles");
const { tokenTypes } = require("../config/tokens");

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    profilePicture: Joi.string(),
    role: Joi.string().valid(...roles.slice(1, 3)),
    mobileNumber: Joi.string().required().custom(mobileNumberValidator),
    companyDescription: Joi.when("role", {
      is: "companyAdmin",
      then: Joi.string(),
    }),
    companyLocation: Joi.when("role", {
      is: "companyAdmin",
      then: Joi.string(),
    }),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    tokenType : Joi.string().valid(...Object.keys(tokenTypes))

  }),
};

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required(),
    otp:Joi.string().required().length(8),
    email : Joi.string().email().required()
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const verifyOTP = {
  body: Joi.object().keys({
    otp: Joi.string().required().length(8),
    email: Joi.string().email().required()
  }),
};


const generateOtp = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    tokenType : Joi.string().valid(...Object.keys(tokenTypes))
  }),

}


module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyOTP,
  generateOtp
};
