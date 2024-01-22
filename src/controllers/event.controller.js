const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const eventService = require("../services/event.service");

const addEvent = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const newEvent = await eventService.addEvent(payload, user);
  res.status(httpStatus.CREATED).send({ newEvent });
});

module.exports = {
  addEvent,
};
