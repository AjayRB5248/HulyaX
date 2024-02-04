const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ticketService = require("../services/tickets.service");

const purchaseTicket = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const ticket = await ticketService.purchaseTicket(payload, user);
  res.status(httpStatus.CREATED).send({ ticket });
});

module.exports = {
    purchaseTicket,
};
