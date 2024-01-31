const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const eventService = require("../services/event.service");

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
  const events = await eventService.listEvents(filterParams,requestUser);
  res.status(httpStatus.CREATED).send({ events });
});

module.exports = {
  addEvent,
  setupEventTickets,
  listEvents,
};
