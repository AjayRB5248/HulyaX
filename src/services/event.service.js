const httpStatus = require("http-status");
const { Event } = require("../models");
const ApiError = require("../utils/ApiError");
const TicketConfigModel = require("../models/ticket-configs.model");
const EventsModel = require("../models/events.model");
const moment = require("moment");
const { convertToUTC, convertFromUTC } = require("./timeZoneConverter.service");
const { eventQueryGen } = require("./queryGenerator.services");
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
    tags,
    eventCategory,
  } = payload;
  const eventOwner = user._id;

  const artistData = artists.map((artist) => {
    return {
      artistName: artist.name,
      genre: artist.genre,
      category: artist.category,
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

  const eventToSave = new EventsModel({
    status,
    eventName,
    eventDescription,
    eventOwner,
    artists: artistData,
    venues: venueData,
    eventImages: eventImageDetails,
    tags,
    eventCategory,
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

const listEvents = async (filterParams, requestUser) => {
  let criteria = {};

  // one admin should only be able to list their events - todo : put this condition elsewhere
  if (requestUser.role === "companyAdmin") {
    criteria.eventOwner = requestUser._id;
  }
  if (filterParams) {
    criteria = {
      ...criteria,
      ...eventQueryGen.listEventQueryGen(filterParams),
    };
  }

  const events = await EventsModel.find(criteria)
    .populate("ticketTypes")
    .lean();
  let processedEvents = events
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

    // todo : optimize this
  if (filterParams.city || filterParams.venueName || filterParams.artist) {
    const { city, venueName, artist } = filterParams;
    if (city) {
      processedEvents = processedEvents.map((event) => {
        return {
          ...event,
          venues: event.venues.filter(
            (v) => v.city.toLowerCase() === city.toLowerCase()
          ),
        };
      });
    }
    if (venueName) {
      processedEvents = processedEvents.map((event) => {
        return {
          ...event,
          venues: event.venues.filter(
            (v) => v.venueName.toLowerCase() === venueName.toLowerCase()
          ),
        };
      });
    }
    if (artist) {
      processedEvents = processedEvents.map((event) => {
        return {
          ...event,
          artists: event.artists.filter(
            (v) => v.artistName.toLowerCase() === artist.toLowerCase()
          ),
        };
      });
    }
  }
  return processedEvents;
};

const editEvent = async (payload, user) => {
  const foundEvent = await EventsModel.findOne({
    _id: payload.eventId,
    eventOwner: user._id,
  });
  if (!foundEvent) throw new Error("Event not found");
};

const getEvent = async (eventId) => {
  const currentEvents = await EventsModel.findById(eventId)
    .populate("ticketTypes")
    .lean();
  if (!currentEvents) throw new Error("Event not found");
  const venues = currentEvents.venues
    .map((e) => {
      return {
        ...e,
        eventDate: convertFromUTC(e.eventDate, e.timeZone),
      };
    })
    .filter(Boolean);

  return { ...currentEvents, venues };
};

module.exports = {
  addEvent,
  setupEventTickets,
  listEvents,
  editEvent,
  getEvent,
};
