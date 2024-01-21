const jwt = require("jsonwebtoken");
const moment = require("moment");
const httpStatus = require("http-status");
const config = require("../config/config");
const userService = require("./user.service");
const { Token } = require("../models");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");
const TwilioService = require("./twilio.service");

const twilioProcess = new TwilioService();

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes"
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    tokenTypes.ACCESS
  );

  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    "days"
  );
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );

  await removeAllToken(user, tokenTypes.REFRESH);

  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordTokenAndSend = async (email, mobileNumber) => {
  const user = await userService.getUserByCriteria({ email, mobileNumber });
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No users found with this email and mobile Number"
    );
  }

  await generateVerifyOTPTokenAndSendToMobile(
    user,
    tokenTypes.OTP_RESET_PASSWORD
  );
  return true;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes"
  );
  const verifyEmailToken = generateToken(
    user.id,
    expires,
    tokenTypes.VERIFY_EMAIL
  );
  await saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

/**
 * Generate verify otp token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyOTPToken = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes"
  );
  await saveToken(otp, user.id, expires, tokenTypes.OTP_MOBILE);
  return otp;
};

/**
 * validate verify otp
 * @param {string} otp
 * @param {string} user
 * @returns {Promise<string>}
 */

const verifyOtp = async (otp, user) => {
  const tokenObject = await Token.findOne({
    token: otp,
    user,
    type: tokenTypes.OTP_MOBILE,
  }).lean();
  if (!tokenObject) throw new Error("Token Not Valid");
  // Check if the token is expired
  if (moment().isAfter(tokenObject.expires)) {
    throw new Error("Token has expired");
  }

  if (tokenObject?.token !== otp) throw new Error("Token Not Valid");

  return true;
};

/**
 * Generate verify otp token and send to mobile device
 * @param {User} user
 * @returns {Promise<boolean>}
 */
const generateVerifyOTPTokenAndSendToMobile = async (user, type) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes"
  );
  await Token.deleteMany({ user: user._id, type });
  await saveToken(otp, user._id, expires, type);
  await twilioProcess.sendOTP(user.name, user.mobileNumber, otp);
  return true;
};

/**
 * Generate verify otp token and send to mobile device
 * @param {User} user
 * @returns {Promise<boolean>}
 */
const removeAllToken = async (user, type) => {
  await Token.deleteMany({ user: user._id, type });
  return true;
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordTokenAndSend,
  generateVerifyEmailToken,
  generateVerifyOTPToken,
  verifyOtp,
  generateVerifyOTPTokenAndSendToMobile,
  removeAllToken,
};
