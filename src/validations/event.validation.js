const Joi = require("joi");
// const { password, objectId } = require('./custom.validation');

const createEvent = {
  body: Joi.object(
    //TODO:
  ).keys({}),
};

module.exports = {
  createEvent,
};
