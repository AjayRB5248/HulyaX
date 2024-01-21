const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const eventService = require("../services/event.service");

const addEvent = catchAsync(async (req, res) => {
  const newEvent = await eventService.addEvent(req.body);
  res.status(httpStatus.CREATED).send({ newEvent });
});

module.exports = {
  addEvent,
};
