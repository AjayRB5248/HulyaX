const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ticketService = require("../services/tickets.service");

const purchaseTicket = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const ticket = await ticketService.purchaseTicket(payload, user);
  res.status(httpStatus.CREATED).send({ ticket });
});


const viewTickets = catchAsync(async (req, res) => {
  const payload = req.body;
  const ticket = await ticketService.viewTickets(payload);
  res.status(httpStatus.CREATED).send({ ticket });
});

const validateTicket = catchAsync(async (req, res) => {
  const payload = req.body;
  const ticket = await ticketService.verifyQRCode(payload);
  res.status(httpStatus.CREATED).send({ ticket });
});

const showPurchasedTicket = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const ticket = await ticketService.getTicketsByCustomer(payload,user);
  res.status(httpStatus.CREATED).send({ ticket });
});

const ticketShowServices  = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const ticket = await ticketService.returnTicketUrl(payload,user);
  res.status(httpStatus.CREATED).send({ ticket });
});


module.exports = {
    purchaseTicket,
    viewTickets,
    validateTicket,
    showPurchasedTicket,
    ticketShowServices
};
