const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const eventService = require("../services/event.service");
const { EVENT_STATUS } = require("../utility/constants");
const { uploadToS3Bucket } = require("../services/s3/s3Service");
const SubEventModel = require("../models/subEvents.model");
const EventModel = require("../models/events.model");

const addEvent = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const files = req.files;
  const eventImages = [];
  for (const file of files) {
    const s3Location = await uploadToS3Bucket(file.buffer, 'image/png',`eventImages/payload.eventName/${Date.now()}`)
    eventImages.push({
      imageurl: s3Location.Location,
      isPrimary: file.fieldname === "posterImage" ? true : false,
    });
  }
  payload.images = eventImages;
  const newEvent = await eventService.addEvent(payload, user);
  res.status(httpStatus.CREATED).send({ newEvent });
});

const assignCompaniesToEvents = catchAsync(async (req, res) => {
  const payload = req?.body;
  const parentEvent = payload.eventId;
  const assignments = payload.assignments;
  const subEvents = assignments.map((stateAccess) => {
    return {
      parentEvent,
      state: stateAccess.state,
      companies: stateAccess.companies,
    };
  }).filter(Boolean);


  const currentEvents = await SubEventModel.find({parentEvent:parentEvent});
  let toInserEvents = [];
  subEvents?.forEach(p=>{
    const isFound = currentEvents?.find((event)=>event?.state+""===p?.state+"" && event?.companies?.[0]+""===p?.companies?.[0]+"");
    const isAssignedToAnotherCompany = currentEvents?.find(event=>event?.state+""===p?.state+"" && event?.companies?.[0]);

    if(!isFound && !isAssignedToAnotherCompany) toInserEvents.push(p);
  })

  if(toInserEvents?.length === 0 ) throw new Error("Event May Be already assigned or Assigned to another company");


  SubEventModel.insertMany(subEvents, async (err, inserted) => {
    if (err) {
      throw err;
    }

    await EventModel.findByIdAndUpdate(parentEvent, {
      $push: {
        assignedCompany: {
          state: subEvents?.[0]?.state,
          companyId: subEvents?.[0]?.companies?.[0],
        },
      },
    });

    const insertedIds = inserted.map((doc) => doc._id);

    const insertedSubEvents = await SubEventModel.find({
      _id: { $in: insertedIds },
    }).populate([
      {
        path: "companies",
        select: { email: 1, name: 1 },
      },
      {
        path: "parentEvent",
        select: { eventName: 1, eventDescription: 1 },
      },
      {
        path: "state",
      },
    ]);
    return res.status(httpStatus.CREATED).send({ insertedSubEvents });
  });
});


const removeCompanyFromEvents = catchAsync(async (req, res) => {
  const payload = req?.body;
  const { eventId, state, companyId } = payload;
  await SubEventModel.deleteOne({
    parentEvent: eventId,
    state: state,
    "companies.0": companyId,
  });

  await EventModel.findOneAndUpdate(
    {
      _id: eventId,
    },
    {
      $pull: {
        assignedCompany: {
          companyId,
          state,
        },
      },
    }
  );

  return res.status(httpStatus.CREATED).send({ success: true });
});



const setupEventTickets = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const eventTicketSettings = await eventService.setupEventTickets(
    payload,
    user
  );
  res.status(httpStatus.CREATED).send({ eventTicketSettings });
});

const listEvents = catchAsync(async (req, res) => {
  const filterParams = req.query;
  const requestUser = req.user;
  const events = await eventService.listEvents(filterParams, requestUser);
  res.status(httpStatus.CREATED).send({ events });
});

const editEvents = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  payload.eventImages = req.files;
  payload.eventId = req.params.eventId;
  const modifiedEvent = await eventService.editEvent(payload, user);
  res.status(httpStatus.CREATED).send({ modifiedEvent });
});

// Add artist , venue, ticket to an event
const addItemsToEvent = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  payload.eventId = req.params.eventId;
  payload.eventImages = req.files;
  const modifiedEvent = await eventService.addItemsToEvent(payload, user);
  res.status(httpStatus.CREATED).send({ modifiedEvent });
});

// Add artist , venue, ticket to an event
const removeItemsFromEvent = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  payload.eventId = req.params.eventId;
  const modifiedEvent = await eventService.removeItemsFromEvent(payload, user);
  res.status(httpStatus.CREATED).send({ modifiedEvent });
});

const deleteEvent = catchAsync(async (req, res) => {
  const eventId  = req.params.eventId;
  const user = req.user;
  const deletedEvent = await eventService.deleteEvent(eventId, user);
  res.status(httpStatus.CREATED).send({ deletedEvent });
});

const getEvents = catchAsync(async (req, res) => {
  const { eventId } = req?.params || {};
  const event = await eventService.getEvent(eventId);
  res.status(httpStatus.CREATED).send({ event });
});

const getEventStatuses = catchAsync(async (req, res) => {
  const eventStatuses = Object.values(EVENT_STATUS)
  res.status(httpStatus.CREATED).send({ eventStatuses });
});

const getPossibleEventVenues = catchAsync(async (req, res) => {
  const eventVenues = await eventService.listVenues(req.query, req.user);
  res.status(httpStatus.CREATED).send({ eventVenues });
});

const getPossibleEventArtists = catchAsync(async (req, res) => {
  const eventArtists = await eventService.listArtists(req.query, req.user);
  res.status(httpStatus.CREATED).send({ eventArtists });
});

module.exports = {
  addEvent,
  assignCompaniesToEvents,
  setupEventTickets,
  listEvents,
  editEvents,
  getEvents,
  addItemsToEvent,
  removeItemsFromEvent,
  deleteEvent,
  getEventStatuses,
  getPossibleEventVenues,
  getPossibleEventArtists,
  removeCompanyFromEvents
};
