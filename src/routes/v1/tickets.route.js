const express = require("express");
const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth");
const ticketController = require("../../controllers/tickets.controller");
const ticketValidation = require("../../validations/tickets.validation");

const router = express.Router();


router.post(
  "/view-tickets",
  validate(ticketValidation.viewTickets),
  ticketController.viewTickets
);


router.post(
  "/purchase-ticket",
  auth("purchaseTicket"),
  ticketController.purchaseTicket
);

module.exports = router;
