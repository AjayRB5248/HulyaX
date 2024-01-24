const httpStatus = require("http-status");
const { Event, TicketConfigs } = require("../models");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const TicketConfigModel = require("../models/ticket-configs.model");

const addEvent = async (payload, user) => {
  if (!user._id) throw new Error("Event Owner not found");
  const { eventName } = payload;
  const eventOwner = user._id;

  const venueDetails = payload.eventLocations
    .map((l) => {
      return {
        _id: mongoose.Types.ObjectId(),
        venueName: l.venueName,
        dateOfEvent: l.date,
      };
    })
    .filter(Boolean);

  const eventToSave = new Event({
    eventName,
    eventOwner,
    venueDetails,
  });
  const saved = await eventToSave.save();
  return saved;
};

const setupEventTickets = async (payload, user) => {
  const { eventId, venueId, ticketTypes } = payload;
  const { _id: eventOwner } = user;
  const foundEvent = await Event.findOne({ _id: eventId, eventOwner });
  if (!foundEvent) throw new Error("Event is not found for this user");
  const ticketConfigs = [];
  for (const tt of ticketTypes) {
    ticketConfigs.push({
      eventId,
      venueId,
      type: tt.type,
      totalCount: tt.seats,
      price: tt.price,
    });
  }
  const insertedTicketSettings = await TicketConfigModel.insertMany(
    ticketConfigs
  );

  // update corresponding event with ticket configs
  const insertedTicketSettingIds = insertedTicketSettings.map((ts) => ts._id);
  await Event.updateOne(
    { _id: eventId },
    { $set: { ticketTypes: insertedTicketSettingIds } }
  );
  
  return insertedTicketSettings;
};

module.exports = {
  addEvent,
  setupEventTickets,
};
