const Joi = require("joi");
// const { password, objectId } = require('./custom.validation');

const createEvent = {
  body: Joi.object().keys({
    eventName: Joi.string().optional(),
    eventLocations: Joi.array()
      .min(1)
      .items(
        Joi.object().keys({
          venueName: Joi.string().required(),
          date: Joi.string().required(),
        })
      )
      .required(),
    // ticketTypes: Joi.array()
    //   .min(1)
    //   .items(
    //     Joi.object().keys({
    //       venue: Joi.string().optional(),
    //       type: Joi.string().required(),
    //       price: Joi.number().required(),
    //     })
    //   )
    //   .required(),
  }),
};

module.exports = {
  createEvent,
};
