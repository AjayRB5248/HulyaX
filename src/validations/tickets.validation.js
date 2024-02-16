const Joi = require("joi");

const viewTickets = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    venueName: Joi.string().required(),
  }),
};


const ticketSchema = Joi.object({
  ticketId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).max(8).required()
});


const purchaseTicket = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    tickets: Joi.array().items(ticketSchema).min(1).required()
  
  }),
};

const validateTicket = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    ticketId: Joi.string().required()
  }),
};











module.exports = {
  viewTickets,purchaseTicket,validateTicket
};
