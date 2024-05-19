const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const TwilioService = require('../services/twilio.service');
const { OTP_GENERATED, OTP_VERIFIED, OTP_GENERATED_FORGET_PASSWORD, PASSWORD_RESET, REGISTERED_SUCCESSFUL } = require('../utils/standardMessage');
const { tokenTypes } = require('../config/tokens');


const twilioProcess = new TwilioService();

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const [userToken,otpToken] = await Promise.all([await tokenService.generateAuthTokens(user),await tokenService.generateVerifyOTPToken(user)]);
  await twilioProcess.sendOTP(user.name,user.mobileNumber,otpToken)
  res.status(httpStatus.CREATED).send({ user, userToken,message:REGISTERED_SUCCESSFUL });
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
  const {otp,password,email} = req?.body || {} ;
  await authService.resetPassword(otp,password,email);
  res.status(httpStatus.CREATED).send({message:PASSWORD_RESET});
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
  const {otp,email} = req?.body || {};
  await authService.verifyNumber(otp,email);
  res.status(httpStatus.CREATED).send({message:OTP_VERIFIED});
});


const generateNewOtp = catchAsync(async (req, res) => {
  const {email,tokenType} = req?.body || {};
  await tokenService.generateVerifyOTPTokenAndSendToMobile(email, tokenType);
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
