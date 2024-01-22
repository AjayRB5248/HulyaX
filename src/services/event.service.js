const httpStatus = require("http-status");
const { Event } = require("../models");
const ApiError = require("../utils/ApiError");

const addEvent = async (payload, user) => {
  if (!user._id) throw new Error("Event Owner not found");
  const { eventName } = payload;
  const eventOwner = user._id;

  const venueDetails = payload.eventLocations.map((l) => {
      return {
        venueName: l.venueName,
        dateOfEvent: l.date,
      };
    }).filter(Boolean);

  const eventToSave = new Event({
    eventName,
    eventOwner,
    venueDetails,
  });
  const saved = await eventToSave.save();
  return saved;
};

module.exports = {
  addEvent,
};
