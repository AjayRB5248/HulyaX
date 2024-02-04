const TicketConfigModel = require("../models/ticket-configs.model");
const EventsModel = require("../models/events.model");
const UserModel = require("../models/user.model");
const TicketModel = require("../models/tickets.model");
const moment = require("moment");

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

const sendConfirmation = async () => {};

const verifyPayment = async () => {}; // can be added in payment service

module.exports = { purchaseTicket, sendConfirmation, verifyPayment };
