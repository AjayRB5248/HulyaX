const Joi = require('joi');
const { password, objectId, mobileNumberValidator } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin'),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};


const updateMobileNumber = {
  body: Joi.object().keys({
    mobileNumber: Joi.string().required().custom(mobileNumberValidator),
    otp : Joi.string().required().length(8)
  }),
};

const updatePassword = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
    newPassword: Joi.string().required().custom(password),
    confirmPassword: Joi.string().required().custom(password)

  }),
};


const approveCompany = {
  body: Joi.object().keys({
    userId : Joi.string().required(),
    isApproved: Joi.boolean().required()
  }),
};


const listCompany = {
  body: Joi.object().keys({
    limit : Joi.number().optional(),
    page: Joi.number().optional(),
    email : Joi.string().optional()

  }),

}




module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMobileNumber,
  updatePassword,
  approveCompany,
  listCompany
};
