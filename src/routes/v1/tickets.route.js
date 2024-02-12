const express = require("express");
const validate = require("../../middlewares/validate");
const { auth } = require("../../middlewares/auth");
const ticketController = require("../../controllers/tickets.controller");
const { PERMISSION_CONSTANTS } = require("../../utility/constants");

const router = express.Router();

router.post(
  "/purchase-ticket",
  auth(PERMISSION_CONSTANTS.PURCHASE_TICKETS),
  ticketController.purchaseTicket
);

module.exports = router;
