const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const eventService = require("../services/event.service");
const { EVENT_STATUS } = require("../utility/constants");

const addEvent = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  payload.eventImages = req.files;
  const newEvent = await eventService.addEvent(payload, user);
  res.status(httpStatus.CREATED).send({ newEvent });
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
  setupEventTickets,
  listEvents,
  editEvents,
  getEvents,
  addItemsToEvent,
  removeItemsFromEvent,
  deleteEvent,
  getEventStatuses,
  getPossibleEventVenues,
  getPossibleEventArtists
};
