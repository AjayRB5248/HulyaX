const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const TwilioService = require('../services/twilio.service');
const { OTP_GENERATED, OTP_VERIFIED, OTP_GENERATED_FORGET_PASSWORD } = require('../utils/standardMessage');
const { tokenTypes } = require('../config/tokens');


const twilioProcess = new TwilioService();

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const [userToken,otpToken] = await Promise.all([await tokenService.generateAuthTokens(user),await tokenService.generateVerifyOTPToken(user)]);
  await twilioProcess.sendOTP(user.name,user.mobileNumber,otpToken)
  res.status(httpStatus.CREATED).send({ user, userToken });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const {email,mobileNumber} = req?.body || {} ;
  await tokenService.generateResetPasswordTokenAndSend(email, mobileNumber);
  res.status(httpStatus.CREATED).send({message:OTP_GENERATED_FORGET_PASSWORD});
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyOTP = catchAsync(async (req, res) => {
  const {otp} = req?.body || {};
  await authService.verifyNumber({...req.user,otp});
  res.status(httpStatus.CREATED).send({message:OTP_VERIFIED});
});


const generateNewOtp = catchAsync(async (req, res) => {
  const {user} = req;
  await tokenService.generateVerifyOTPTokenAndSendToMobile(user,tokenTypes.OTP_MOBILE);
  res.status(httpStatus.CREATED).send({message:OTP_GENERATED});
});



module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  verifyOTP,
  generateNewOtp
};
