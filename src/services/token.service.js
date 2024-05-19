const jwt = require("jsonwebtoken");
const moment = require("moment");
const httpStatus = require("http-status");
const config = require("../config/config");
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
  
  await generateVerifyOTPTokenAndSendToMobile(
    email,
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
  const otp = (Math.floor(Math.random() * 90000000) + 10000000).toString();
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes"
  );
  const jwtToken = await generateCustomToken({otp,user:user.id})
  await saveToken(jwtToken, user.id, expires, tokenTypes.OTP_MOBILE);
  return otp;
};

/**
 * validate verify otp
 * @param {string} otp
 * @param {string} user
 * @returns {Promise<string>}
 */

const verifyOtp = async (user, otp,type) => {
  const tokenObject = await Token.findOne({
    user,
    type
  }).sort({createdAt:-1}).lean();
  console.log(user,otp,type)
  if (!tokenObject) throw new Error("Token Not Valid");
  // Check if the token is expired

  const decodedToken = jwt.decode(tokenObject.token, config.jwt.secret);

  console.log(decodedToken);
  if (decodedToken?.otp !== otp) throw new Error("Token Not Valid");

  if (moment().isAfter(tokenObject.expires)) {
    throw new Error("Token has expired");
  }

  return true;
};

/**
 * Generate verify otp token and send to mobile device
 * @param {User} user
 * @returns {Promise<boolean>}
 */
const generateVerifyOTPTokenAndSendToMobile = async (email, tokenType) => {
  const userService = require("./user.service");
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No users found with this email and mobile Number"
    );
  }
  const otp = (Math.floor(Math.random() * 90000000) + 10000000).toString();
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes"
  );
  await Token.deleteMany({ user: user._id, type:tokenTypes[tokenType] });
  const signedOtp = await generateCustomToken({otp,user:user._id})
  await saveToken(signedOtp, user._id, expires, tokenTypes[tokenType]);
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



const generateCustomToken = async (payloadData , JWT_SECRET = config.jwt.secret) =>{
  return jwt.sign(payloadData, JWT_SECRET, { expiresIn: '10m' });
}





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
