const TicketConfigModel = require("../models/ticket-configs.model");
const TicketModel = require("../models/tickets.model");
const moment = require("moment");
const EventModel = require("../models/events.model");
const TicketConfigs = require("../models/ticket-configs.model");

const purchaseTicket = async (payload, user) => {
  // TODO:
  const { ticketType } = payload; // receive other payment related keys from payload
  const updateConfig = await TicketConfigModel.findByIdAndUpdate(
    ticketType,
    {
      $inc: { soldSeats: 1, availableSeats: -1 },
    },
    { new: true }
  ).lean();

  // verify payment and get generate ticket confirmation code
  await verifyPayment(user);

  const bookedTicket = new TicketModel({
    status: "CONFIRMED",
    ticketTypeId: ticketType,
    bookedDate: moment().toISOString(),
    eventId: updateConfig.eventId,
    customer: user._id,
    // confirmationCode : generateConfirmationCode()
  });
  await bookedTicket.save();

  await sendConfirmation(user, bookedTicket);
  return "katta";
};

const viewTickets = async (payload, user) => {

  const {eventId,venueName} = payload;
  const currentEvents = await EventModel.findById(eventId).lean();
  if(!currentEvents) throw new Error("Event not found");
  const venueId = (currentEvents?.venues?.find(venue=>venue?.venueName+""===venueName+""))?._id;
  if(!venueId) throw new Error("Venue not found");
  const ticketCollections = await TicketConfigs.find({venueId,eventId}).lean();
  return ticketCollections;

};


const sendConfirmation = async () => {};

const verifyPayment = async () => {}; // can be added in payment service

module.exports = { purchaseTicket, sendConfirmation, verifyPayment , viewTickets };
