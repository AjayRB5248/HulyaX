const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const eventService = require("../services/event.service");

const addEvent = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const files = req.files;
  const { posterImage : primaryImage , images } = files;
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

module.exports = {
  addEvent,
  setupEventTickets,
};
