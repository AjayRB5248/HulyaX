const express = require("express");
const validate = require("../../middlewares/validate");
const { auth } = require("../../middlewares/auth");
const ticketController = require("../../controllers/tickets.controller");

const router = express.Router();

router.post(
  "/purchase-ticket",
  auth("purchaseTicket"),
  ticketController.purchaseTicket
);

module.exports = router;
