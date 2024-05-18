const express = require("express");
const validate = require("../../middlewares/validate");
const { auth } = require("../../middlewares/auth");
const ticketController = require("../../controllers/tickets.controller");
const ticketValidation = require("../../validations/tickets.validation");
const { PERMISSION_CONSTANTS } = require("../../utility/constants");

const router = express.Router();


router.post(
  "/view-tickets",
  // validate(ticketValidation.viewTickets),
  auth(),
  ticketController.viewTickets
);


router.post(
  "/purchase-ticket",
  auth(PERMISSION_CONSTANTS.PURCHASE_TICKETS),
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
  auth(PERMISSION_CONSTANTS.PURCHASE_TICKETS),
  ticketController.showPurchasedTicket
);

router.post(
  "/send-ticket",
  auth(PERMISSION_CONSTANTS.PURCHASE_TICKETS),
  ticketController.ticketShowServices
);





module.exports = router;
