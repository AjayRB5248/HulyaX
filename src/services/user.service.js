const httpStatus = require("http-status");
const { User, Company } = require("../models");
const ApiError = require("../utils/ApiError");
const { roles: ALL_ROLES } = require("../config/roles");
const mongoose = require("mongoose");
const { tokenTypes } = require("../config/tokens");

const {verifyOtp} = require("./token.service");

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (
    (await User.isEmailTaken(userBody.email)) ||
    (await User.isMobileNumberTaken(userBody.mobileNumber))
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Email or Mobile Number already taken`
    );
  }

  return await handleUserCreation(userBody);
};

const handleUserCreation = async (userBody) => {
  let newUser; //
  const {
    role,
    companyDescription,
    email,
    name,
    password,
    profilePicture,
    companyLocation,
    mobileNumber,
  } = userBody || {};
  //return user
  if (role !== ALL_ROLES[1]) {
    newUser = User.create({ name, email, password, role, mobileNumber });
    return newUser;
  }

  const userId  =  mongoose.Types.ObjectId();
  const newCompany = await Company.create({
    name,
    admin: null, // You'll need to set this to the actual admin user later
    description: companyDescription,
    location: companyLocation,
    admin : userId
  });

  newUser = User.create({
    _id : userId,
    name,
    email,
    password,
    role,
    company: newCompany._id,
    mobileNumber,
  });

  newCompany.admin = newUser._id;

  return newUser;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Get user by criteria
 * @param {object} criteria
 * @returns {Promise<User>}
 */
const getUserByCriteria = async (criteria) => {
  return User.findOne(criteria);
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  
  delete updateBody?.mobileNumber;

  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email or Passsword already taken");
  }

   

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.remove();
  return user;
};

const updateDisplayPicture = async (file,user) => {
  await User.findByIdAndUpdate(user._id,{profilePicture:file.location});
  return;
};

const updateMobileNumbers = async (user, mobileNumber, otp) => {
  if (user.mobileNumber === mobileNumber) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      "Mobile Number must be different!"
    );
  }

  



  await verifyOtp(user._id, otp, tokenTypes.OTP_CHANGE_MOBILE);
  await User.findByIdAndUpdate(user._id, { mobileNumber });
  return 0;
};

const updatePassword = async (user, password, newPassword, confirmPassword) => {
  if (newPassword + "" !== confirmPassword + "") {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      "New passwords do not match."
    );
  }


  const currentUser = await User.findById(user._id);

  const isMatched = await currentUser.isPasswordMatch(password);
  if (!isMatched)
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      "Current Password is not a valid"
    );

  currentUser.password = newPassword;
  await currentUser.save();

  return 0;
};



module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUserByCriteria,
  updateDisplayPicture,
  updateMobileNumbers,
  updatePassword
};
