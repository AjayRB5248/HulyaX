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
  validate(ticketValidation.purchaseTicket),
  ticketController.purchaseTicket
);

router.post(
  "/validate-ticket",
  // auth("validateTicket"),
  validate(ticketValidation.validateTicket),
  ticketController.validateTicket
);

router.post(
  "/show-purchased-ticket",
  auth("purchaseTicket"),
  ticketController.showPurchasedTicket
);

router.post(
  "/send-ticket",
  auth("purchaseTicket"),
  ticketController.ticketShowServices
);





module.exports = router;
