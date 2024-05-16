const httpStatus = require("http-status");
const { Event } = require("../models");
const ApiError = require("../utils/ApiError");
const TicketConfigModel = require("../models/ticket-configs.model");
const EventsModel = require("../models/events.model");
const VenueModel = require("../models/venue.model");
const ArtistModel = require("../models/artist.model");
const moment = require("moment");
const { convertToUTC, convertFromUTC } = require("./timeZoneConverter.service");
const { eventQueryGen } = require("./queryGenerator.services");
const SubEventModel = require("../models/subEvents.model");
const mongoose = require("mongoose");
require("moment-timezone");

const addEvent = async (payload, user) => {
  if (!user._id) throw new Error("Event Owner not found");
  const {
    eventName,
    eventDescription,
    artists,
    images,
    status,
    tags,
    eventCategory,
    videoUrl,
    states,
  } = payload;

  const saved = await EventsModel.findOneAndUpdate(
    { eventName },
    {
      status,
      eventName,
      eventDescription,
      artists,
      images,
      tags,
      eventCategory,
      videoUrl,
      states,
    },
    { upsert: true, new: true }
  )
    .populate("artists states")
    .lean();

  return saved;
};

const assignCompaniesToEvents = async (payload) => {};

const setupEventTickets = async (eventDoc, ticketSettings) => {
  const { _id: eventId, eventOwner } = eventDoc;

  const ticketConfigToInsert = ticketSettings.map((tc) => {
    return {
      eventId,
      venueId: tc.venueId,
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
  )
    .populate("ticketTypes artists")
    .populate({
      path: "venues._id",
      model: "Venue",
    })
    .lean();

  const eventVenues = updatedEvent.venues;
  delete updatedEvent.venues;

  const events = {
    ...updatedEvent,
    venues: eventVenues.map((v) => {
      return {
        ...v._id,
      };
    }),
  };
  return events;
};

const listEvents = async (filterParams, requestUser) => {
  let criteria = {};

  if (requestUser?.role === "customer") {
    criteria.isDeleted = { $ne: true };
  }
  // one admin should only be able to list their events - todo : put this condition elsewhere
  if (requestUser?.role === "companyAdmin") {
    criteria.eventOwner = requestUser._id;
  }

  if (filterParams) {
    const {
      eventName,
      artist,
      states,
      city,
      eventDate,
      venueName,
      eventCategory,
    } = filterParams;
    if (eventCategory)
      criteria.eventCategory = { $regex: eventCategory, $options: "i" };
    if (eventName) criteria.eventName = { $regex: eventName, $options: "i" };
    if (artist) criteria.artist = { $in: [artist] };
    if (artist) criteria.artist = { $in: [artist] };
    if (states) criteria.states = { $in: [states] };

    // if (eventDate) {
    //   const convertedEventDate = convertToUTC(eventDate, `Australia/${city}`);
    //   criteria.venues["$elemMatch"]["eventDate"] = {
    //     $gte: new Date(convertedEventDate.startOf("day").toISOString()),
    //     $lte: new Date(convertedEventDate.endOf("day").toISOString()),
    //   };
    // }

    // if (city || venueName) {
    //   const venueCriteria = {};
    //   if (city) venueCriteria.city = { $regex: city, $options: "i" };
    //   if (venueName)
    //     venueCriteria.venueName = { $regex: venueName, $options: "i" };
    //   let venues = await VenueModel.find(venueCriteria).select("_id");
    //   if (!venues?.length) throw new Error("EVENTS NOT FOUND");
    //   venues = venues.map((v) => v._id);
    //   criteria["venues._id"] = { $in: venues };
    // }

    // if (artist) {
    //   const artistCriteria = {};
    //   if (artist) artistCriteria.artistName = { $regex: artist, $options: "i" };
    //   let artistIds = await ArtistModel.find(artistCriteria).select("_id");
    //   if (!artistIds?.length) throw new Error("EVENTS NOT FOUND");
    //   artistIds = artistIds.map((a) => a._id);
    //   criteria.artists = { $in: artistIds };
    // }
  }

  const dbEvent = await EventsModel.find(criteria)
    .populate("states artists")
    .lean();

  return dbEvent;
};

const editEvent = async (payload, user) => {
  const criteria = {
    _id: payload.eventId,
    eventOwner: user._id,
  };
  if (user.role === "superAdmin") delete criteria.eventOwner;
  const event = await EventsModel.findOne(criteria)
    .populate("ticketTypes artists")
    .populate({
      path: "venues._id",
      model: "Venue",
    })
    .lean();

  const eventVenues = event.venues;
  delete event.venues;

  const events = {
    ...updatedEvent,
    venues: eventVenues.map((v) => {
      return {
        ...v._id,
      };
    }),
  };

  if (!event) throw new Error("Event not found");

  const foundEvent = event.map((event) => {
    const eventVenues = event.venues;
    delete event.venues;
    return {
      ...event,
      venues: eventVenues.map((v) => {
        return {
          ...v._id,
        };
      }),
    };
  });

  const {
    eventName,
    eventDescription,
    status,
    tags,
    artist,
    venue,
    ticketType,
    eventImages,
    videoUrl,
  } = payload;
  const updatePayload = {};
  if (eventName) updatePayload.eventName = eventName;
  if (eventDescription) updatePayload.eventDescription = eventDescription;
  if (videoUrl) updatePayload.videoUrl = videoUrl;
  if (status) updatePayload.status = status;

  // can update posterImage from here
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

  // edit artist details - artist can be update only via superadmin
  // if (artist?._id) {
  //   let currentArtists = foundEvent.artists;
  //   let artistToUpdate = currentArtists
  //     .map((a) => {
  //       if (a._id + "" === artist?._id + "") {
  //         if (artist.artistName) a.artistName = artist.artistName;
  //         if (artist.genre) a.genre = artist.genre;
  //         if (artist.category) a.category = artist.category;
  //       }
  //       return a;
  //     })
  //     .filter(Boolean);
  //   if (artistToUpdate.length) updatePayload.artists = artistToUpdate;
  // }

  //edit venues details - artist can be update only via superadmin
  // if (venue?._id) {
  //   if (!venue.timeZone) throw new Error("Timezone missing in payload");
  //   let currentVenues = foundEvent.venues;
  //   let venueToUpdate = currentVenues
  //     .map((v) => {
  //       if (v._id + "" === venue?._id + "") {
  //         if (venue.venueName) v.venueName = venue.venueName;
  //         if (venue.city) v.city = venue.city;
  //         if (venue.timeZone) v.timeZone = venue.timeZone;
  //         if (venue.dateOfEvent)
  //           v.eventDate = convertToUTC(venue.dateOfEvent, venue.timeZone);
  //       }
  //       return v;
  //     })
  //     .filter(Boolean);
  //   if (venueToUpdate.length) updatePayload.venues = venueToUpdate;
  // }

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
    .populate("ticketTypes artists venues")
    .lean();
  return updatedEvent;
};

const deleteEvent = async (eventId, user) => {
  if (!eventId) throw new Error("EventId not found");
  const criteria = {
    _id: eventId,
    eventOwner: user._id,
  };
  if (user.role === "superAdmin") delete criteria.eventOwner;
  const foundEvent = await EventsModel.findOneAndUpdate(criteria, {
    $set: { isDeleted: false },
  });
  if (!foundEvent) throw new Error("Event not found");
  const deletedEvent = await EventsModel.findOneAndUpdate(
    critera,
    { $set: { isDeleted: true } },
    { new: true }
  ).lean();
  return deletedEvent;
};

const getEvent = async (eventId) => {
  const currentEvents = await EventsModel.findById(eventId).lean();
  if (!currentEvents) throw new Error("Event not found");
  return { ...currentEvents, venues };
};

const addItemsToEvent = async (payload, user) => {
  const criteria = {
    _id: payload.eventId,
    eventOwner: user._id,
  };
  if (user.role === "superAdmin") delete criteria.eventOwner;
  const addToSetPayload = {};
  const foundEvent = await EventsModel.findOne(criteria)
    .populate("ticketTypes artists venues")
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
    .populate("ticketTypes artists venues")
    .lean();
  return updatedEvent;
};

const removeItemsFromEvent = async (payload, user) => {
  const criteria = {
    _id: payload.eventId,
    eventOwner: user._id,
  };
  if (user.role === "superAdmin") delete criteria.eventOwner;
  const foundEvent = await EventsModel.findOne(criteria)
    .populate("ticketTypes artists venues")
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
    .populate("ticketTypes artists venues")
    .lean();
  return updatedEvent;
};

const listVenues = async (filterQuery, user) => {
  const criteria = {};
  if (["customer", "companyAdmin"].includes(user.role)) {
    criteria.isDeleted = { $ne: true };
  }
  if (filterQuery.venueName) {
    criteria.venueName = { $regex: filterQuery.venueName, $options: "i" };
  }
  if (filterQuery.city) {
    criteria.city = { $regex: filterQuery.city, $options: "i" };
  }
  const found = await VenueModel.find(criteria).lean();
  return found;
};

const listArtists = async (filterQuery, user) => {
  const criteria = {};
  if (["customer", "companyAdmin"].includes(user.role)) {
    criteria.isDeleted = { $ne: true };
  }
  if (filterQuery.artistName) {
    criteria.artistName = { $regex: filterQuery.artistName, $options: "i" };
  }
  if (filterQuery.category) {
    criteria.category = { $regex: filterQuery.category, $options: "i" };
  }
  if (filterQuery.status) {
    criteria.status = { $in: [filterQuery.status] };
  }
  const found = await ArtistModel.find(criteria).lean();
  return found;
};

const viewAssignedEvents = async (user, payload) => {

  const { limit, page } = payload || {};

  const perPage = limit ? parseInt(limit) : 20;
  const pageNumber = page ? parseInt(page) : 1;
  const skip = (pageNumber - 1) * perPage;

  

  const assignedTicketPipeLine = [
    user?.role === "companyAdmin"
      ? {
          $match: {
            companies: {
              $in: [mongoose.Types.ObjectId(user?._id)],
            },
          },
        }
      : {},
    { $sort: { createdAt: -1 } },
    { $skip: skip }, // Pagination - skip
    { $limit: perPage }, // Pagination - limit
    {
      $lookup: {
        from: "events",
        localField: "parentEvent",
        foreignField: "_id",
        as: "mainEvent",
      },
    },
    {
      $unwind: {
        path: "$mainEvent",
      },
    },
    {
      $lookup: {
        from: "artists",
        localField: "mainEvent.artists",
        foreignField: "_id",
        as: "mainEvent.artistsData",
      },
    },

    {
      $lookup: {
        from: "states",
        localField: "state",
        foreignField: "_id",
        as: "currentState",
      },
    },

    {
      $unwind: {
        path: "$currentState",
      },
    },

    {
      $lookup: {
        from: "ticketconfigs",
        localField: "ticketTypes",
        foreignField: "_id",
        as: "ticketConfigs",
      },
    },

    {
      $project: {
        _id: 1,
        eventName: "$mainEvent.eventName",
        artists: "$mainEvent.artistsData",
        eventCategory: "$mainEvent.eventCategory",
        eventDescription: "$mainEvent.eventDescription",
        images: "$mainEvent.images",
        state: "$currentState",
        ticketConfig: "$ticketConfigs",
      },
    },
  ];

  const assignedTicketPipeLineWithoutGarbage = assignedTicketPipeLine.filter(
    (stage) => Object.keys(stage).length > 0
  );

  const AssignedEvents = await SubEventModel.aggregate(assignedTicketPipeLineWithoutGarbage);
  
  return AssignedEvents;
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
  listVenues,
  listArtists,
  assignCompaniesToEvents,
  viewAssignedEvents,
};
