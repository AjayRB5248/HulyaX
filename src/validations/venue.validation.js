const Joi = require("joi");

const addVenue = {
  body: Joi.object().keys({
    venues: Joi.array().items(
      Joi.object().keys({
        venueName: Joi.string().required(),
        city: Joi.string().required(),
        timeZone: Joi.string().required(),
        capacity: Joi.number().optional(),
      })
    ),
  }),
};

const updateVenue = {
  body: Joi.object().keys({
    venueName: Joi.string().optional(),
    city: Joi.string().optional(),
    timeZone: Joi.string().optional(),
    capacity: Joi.number().optional(),
  }),
};

const deleteVenue = {
  params: Joi.object()
    .keys({
      venueId: Joi.string().required(),
    })
    .unknown(),
};

module.exports = {
  addVenue,
  deleteVenue,
  updateVenue,
};