const Joi = require("joi");

const viewTickets = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    venueName: Joi.string().required(),
  }),
};



module.exports = {
  viewTickets
};
