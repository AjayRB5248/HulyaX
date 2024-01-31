const httpStatus = require("http-status");
const { Event, TicketConfigs } = require("../models");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const TicketConfigModel = require("../models/ticket-configs.model");
const moment = require("moment");
const { convertToUTC, convertFromUTC } = require("./timeZoneConverter.service");
require("moment-timezone");

const addEvent = async (payload, user) => {
  if (!user._id) throw new Error("Event Owner not found");
  const {
    eventName,
    eventDescription,
    artists,
    venues,
    ticketSettings,
    eventImages,
    status,
  } = payload;
  const eventOwner = user._id;

  const artistData = artists.map((artist) => {
    return {
      artistName: artist.name,
      genre: artist.genre,
      // other data
    };
  });

  const venueData = venues.map((venue) => {
    return {
      venueName: venue.venueName,
      city: venue.city,
      timeZone: venue.timeZone,
      eventDate: convertToUTC(venue.dateOfEvent, venue.timeZone),
    };
  });

  let eventImageDetails = eventImages.secondaryImages.map((im) => {
    return {
      imageurl: im,
      isPrimary: false,
    };
  });
  eventImageDetails = [
    ...eventImageDetails,
    { imageurl: eventImages.primaryImages[0], isPrimary: true },
  ];

  const eventToSave = new Event({
    status,
    eventName,
    eventDescription,
    eventOwner,
    artists: artistData,
    venues: venueData,
    eventImages: eventImageDetails,
  });
  const saved = await eventToSave.save();
  const updatedEvent = await setupEventTickets(saved, ticketSettings);
  return updatedEvent;
};

const setupEventTickets = async (eventDoc, ticketSettings) => {
  const { _id: eventId, eventOwner, venues } = eventDoc;

  const ticketConfigToInsert = ticketSettings.map((tc) => {
    return {
      eventId,
      venueId: venues.find((v) => v.venueName === tc.venueName),
      eventOwner,
      type: tc.type,
      price: tc.price,
      totalSeats: tc.totalSeats,
      availableSeats: tc.totalSeats, // initially , availableSeats is totalSeats
    };
  });

  const savedTicketSettings = await TicketConfigModel.insertMany(
    ticketConfigToInsert
  );
  const insertedTicketSettingIds = savedTicketSettings.map((tc) => tc._id);
  const updatedEvent = await Event.findOneAndUpdate(
    { _id: eventId },
    { $set: { ticketTypes: insertedTicketSettingIds } },
    { new: true }
  ).populate("ticketTypes");
  return updatedEvent;
};

const listEvents = async (filterParams) => {
  const criteria = {};
  if (filterParams) {
    const { eventName } = filterParams;
    if (eventName) criteria.eventName = eventName;
  }
  const events = await Event.find(criteria)
    .sort({ createdAt: -1 })
    .populate("ticketTypes")
    .lean();
  // TODO : process event dates etc ...

  const processedEvents = events
    .map((event) => {
      return {
        ...event,
        venues: event.venues
          .map((e) => {
            return {
              ...e,
              eventDate: convertFromUTC(e.eventDate, e.timeZone),
            };
          })
          .filter(Boolean),
      };
    })
    .filter(Boolean);
  return processedEvents;
};

module.exports = {
  addEvent,
  setupEventTickets,
  listEvents,
};
