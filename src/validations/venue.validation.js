const Joi = require("joi");

const addVenue = {
  body: Joi.object().keys({
    venues: Joi.array().items(
      Joi.object().keys({
        venueName: Joi.string().required(),
        state: Joi.string().required()
      })
    ),
  }),
};

const addStates = {
  body: Joi.object().keys({
    states: Joi.array().items(
      Joi.object().keys({
        stateName: Joi.string().required(),
        timeZone: Joi.string().optional(),
      })
    ),
  }),
};

const updateVenue = {
  body: Joi.object().keys({
    venueName: Joi.string().optional(),
    state: Joi.string().optional(),
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
  addStates
};
