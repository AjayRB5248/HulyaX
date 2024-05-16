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
  }),
};

const setupEventTickets = {
  body: Joi.object()
    .keys({
      eventId: Joi.string().required(),
      venueId: Joi.string().required(),
      ticketTypes: Joi.array()
        .min(1)
        .items(
          Joi.object().keys({
            type: Joi.string().required(),
            price: Joi.number().required(),
            seats: Joi.number().required(),
          })
        ),
      // TODO : add other payload validators
    })
    .unknown(),
};

const editEvent = {
  params: Joi.object()
    .keys({
      eventId: Joi.string().required(),
    })
    .unknown(),
};

const getSingleEvents = {
  params: Joi.object()
    .keys({
      eventId: Joi.string().required(),
    })
    .unknown(),
};

const viewAssignedEvents = {
  params: Joi.object()
    .keys({
        limit : Joi.number().optional(),
        page  : Joi.number().optional()
    })
    .unknown(),
};

module.exports = {
  createEvent,
  setupEventTickets,
  editEvent,
  getSingleEvents,
  viewAssignedEvents
};
