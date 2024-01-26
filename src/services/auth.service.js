const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");
const tokenService = require("./token.service");
const userService = require("./user.service");
const Token = require("../models/token.model");
const ApiError = require("../utils/ApiError");
const moment = require("moment");
const { tokenTypes } = require("../config/tokens");
const config = require("../config/config");

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Not found");
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH
    );
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @param {string} email
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword, email) => {
  try {
    const { _id } = await userService.getUserByEmail(email);
    const resetPasswordTokenDoc = await Token.findOne({
      user: _id,
      type: tokenTypes.OTP_RESET_PASSWORD,
    })
      .sort({ createdAt: -1 })
      .lean();
    
    if (moment().isAfter(resetPasswordTokenDoc.expires)) {
      throw new Error("Token has expired");
    }

    const decodedToken = jwt.decode(resetPasswordTokenDoc.token, config.jwt.secret);


    if (decodedToken?.otp !== resetPasswordToken) {
      throw new Error("Token Not Valid");
    }

    await userService.updateUserById(_id, { password: newPassword });
    await Token.deleteMany({ user: _id, type: tokenTypes.OTP_RESET_PASSWORD });
  } catch (error) {
    console.error(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, error.message);
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(
      verifyEmailToken,
      tokenTypes.VERIFY_EMAIL
    );
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

/**
 * Verify Number
 * @param {object} payloadData
 * @returns {Promise}
 */
const verifyNumber = async (otp, email) => {
  try {
    const { _id } = await userService.getUserByEmail(email);
    await tokenService.verifyOtp(_id, otp,tokenTypes.OTP_MOBILE);
    await Token.deleteMany({ user: _id, type: tokenTypes.OTP_MOBILE });
    await userService.updateUserById(_id, { isNumberVerified: true });
  } catch (error) {
    console.error(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, error);
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  verifyNumber,
};
