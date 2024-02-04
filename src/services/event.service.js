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
    videoUrl
  } = payload;
  const eventOwner = user._id;

  const artistData = artists.map((artist) => {
    return {
      artistName: artist.name,
      genre: artist.genre,
      category: artist.category,
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
    videoUrl
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

  if (requestUser.role === "customer") {
    criteria.isDeleted = { $ne: true };
  }
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
  const criteria = {
    _id: payload.eventId,
    eventOwner: user._id,
  };
  const foundEvent = await EventsModel.findOne(criteria)
    .populate("ticketTypes")
    .lean();
  if (!foundEvent) throw new Error("Event not found");
  const {
    eventName,
    eventDescription,
    status,
    tags,
    artist,
    venue,
    ticketType,
    eventImages,
    videoUrl
  } = payload;
  const updatePayload = {};
  if (eventName) updatePayload.eventName = eventName;
  if (eventDescription) updatePayload.eventDescription = eventDescription;
  if (videoUrl) updatePayload.videoUrl = videoUrl;
  if (status) updatePayload.status = status;
  if (
    Array.isArray(eventImages.primaryImages) &&
    eventImages.primaryImages.length
  ) {
    updatePayload.eventImages = foundEvent.eventImages
      .map((image) => {
        if (image.isPrimary) {
          image.imageurl = eventImages.primaryImages[0];
        }
        return image;
      })
      .filter(Boolean);
  }

  const addToSet = {};
  if (Array.isArray(tags)) addToSet.tags = { $each: tags };

  //edit artist details
  if (artist?._id) {
    let currentArtists = foundEvent.artists;
    let artistToUpdate = currentArtists
      .map((a) => {
        if (a._id + "" === artist?._id + "") {
          if (artist.artistName) a.artistName = artist.artistName;
          if (artist.genre) a.genre = artist.genre;
          if (artist.category) a.category = artist.category;
        }
        return a;
      })
      .filter(Boolean);
    if (artistToUpdate.length) updatePayload.artists = artistToUpdate;
  }

  //edit venues details
  if (venue?._id) {
    if (!venue.timeZone) throw new Error("Timezone missing in payload");
    let currentVenues = foundEvent.venues;
    let venueToUpdate = currentVenues
      .map((v) => {
        if (v._id + "" === venue?._id + "") {
          if (venue.venueName) v.venueName = venue.venueName;
          if (venue.city) v.city = venue.city;
          if (venue.timeZone) v.timeZone = venue.timeZone;
          if (venue.dateOfEvent)
            v.eventDate = convertToUTC(venue.dateOfEvent, venue.timeZone);
        }
        return v;
      })
      .filter(Boolean);
    if (venueToUpdate.length) updatePayload.venues = venueToUpdate;
  }

  // edit ticket settings
  if (ticketType?._id) {
    const updateTicketConfig = {
      _id: ticketType._id,
    };
    const updateTicketPaylpad = {};
    if (ticketType.price)
      updateTicketPaylpad.price = parseInt(ticketType.price);
    if (ticketType.type) updateTicketPaylpad.type = ticketType.type;
    if (ticketType.totalSeats)
      updateTicketPaylpad.totalSeats = parseInt(ticketType.totalSeats);
    if (ticketType.venue) {
      const foundAttachedEvent = foundEvent.venues.find(
        (v) => v.venueName === ticketType.venue
      );
      if (!foundAttachedEvent?._id)
        throw new Error("Provide venue name not linked with this event");
      updateTicketPaylpad.venueId = foundAttachedEvent?._id;
    }
    await TicketConfigModel.findOneAndUpdate(
      updateTicketConfig,
      updateTicketPaylpad
    );
  }

  const updatedEvent = await EventsModel.findOneAndUpdate(
    criteria,
    { $set: updatePayload, $addToSet: { ...addToSet } },
    { new: true }
  )
    .populate("ticketTypes")
    .lean();
  return updatedEvent;
};

const deleteEvent = async (eventId, user) => {
  if (!eventId) throw new Error("EventId not found");
  const foundEvent = await EventsModel.findOneAndUpdate(
    {
      _id: eventId,
      eventOwner: user._id,
    },
    { $set: { isDeleted: false } }
  );
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
        // eventDate: convertFromUTC(e.eventDate, e.timeZone),  : conversoin should be at FE
      };
    })
    .filter(Boolean);

  return { ...currentEvents, venues };
};

const addItemsToEvent = async (payload, user) => {
  const criteria = {
    _id: payload.eventId,
    eventOwner: user._id,
  };
  const addToSetPayload = {};
  const foundEvent = await EventsModel.findOne(criteria)
    .populate("ticketTypes")
    .lean();
  if (!foundEvent) throw new Error("Event not found");
  const { artist, venue, ticketType, eventImages } = payload;
  if (artist) {
    addToSetPayload.artists = {};
    if (artist.artistName)
      addToSetPayload.artists.artistName = artist.artistName;
    if (artist.genre) addToSetPayload.artists.genre = artist.genre;
    if (artist.category) addToSetPayload.artists.category = artist.category;
  }

  if (venue) {
    addToSetPayload.venues = {};
    if (venue.timeZone) addToSetPayload.venues.timeZone = venue.timeZone;
    if (venue.city) addToSetPayload.venues.city = venue.city;
    if (venue.dateOfEvent)
      addToSetPayload.venues.eventDate = convertToUTC(
        venue.dateOfEvent,
        venue.timeZone
      );
  }

  if (ticketType) {
    const eventId = payload.eventId;
    const venueId = foundEvent.venues.find(
      (v) => v.venueName === ticketType.venueName?.trim()
    )?._id;
    if (!venueId)
      throw new Error("Selected venue does not exist for this event");
    const totalSeats = parseInt(ticketType.totalSeats);
    const type = ticketType.type;
    const price = parseInt(ticketType.price);
    const newTicketSettins = new TicketConfigModel({
      eventId,
      venueId,
      totalSeats,
      availableSeats: totalSeats,
      type,
      price,
    });
    const saved = await newTicketSettins.save();
    addToSetPayload.ticketTypes = saved._id;
  }

  const updatePayload = { $addToSet: { ...addToSetPayload } };
  const { primaryImages, secondaryImages } = eventImages;
  // dont update primary/poster image from this route
  if (Array.isArray(secondaryImages) && secondaryImages.length) {
    const imagesToAdd = secondaryImages
      .map((image) => {
        return {
          imageurl: image,
          isPrimary: false,
        };
      })
      .filter(Boolean);
    updatePayload["$push"] = {
      eventImages: imagesToAdd,
    };
  }
  const updatedEvent = await EventsModel.findOneAndUpdate(
    criteria,
    updatePayload,
    { new: true }
  )
    .populate("ticketTypes")
    .lean();
  return updatedEvent;
};

const removeItemsFromEvent = async (payload, user) => {
  const criteria = {
    _id: payload.eventId,
    eventOwner: user._id,
  };
  const foundEvent = await EventsModel.findOne(criteria)
    .populate("ticketTypes")
    .lean();
  if (!foundEvent) throw new Error("Event not found");
  const { ticketTypeId, artistId, venueId, eventImageId } = payload;
  const updatePayload = {
    $pull: {},
  };

  if (artistId)
    updatePayload.$pull.artists = {
      _id: artistId,
    };

  if (venueId)
    updatePayload.$pull.venues = {
      _id: venueId,
    };

  if (eventImageId)
    updatePayload.$pull.eventImages = {
      _id: eventImageId,
    };

  if (ticketTypeId) {
    await TicketConfigModel.findByIdAndRemove(ticketTypeId);
    updatePayload.$pull.ticketTypes = ticketTypeId;
  }

  const updatedEvent = await EventsModel.findOneAndUpdate(
    criteria,
    updatePayload,
    { new: true }
  )
    .populate("ticketTypes")
    .lean();
  return updatedEvent;
};

module.exports = {
  addEvent,
  setupEventTickets,
  listEvents,
  editEvent,
  getEvent,
  deleteEvent,
  addItemsToEvent,
  removeItemsFromEvent,
};
