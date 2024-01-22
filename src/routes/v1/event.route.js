const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const eventController = require("../../controllers/event.controller");
const eventValidation = require("../../validations/event.validation");
const router = express.Router();

router.route("/add-new-event").post(
  auth("addNewEvent"),
  validate(eventValidation.createEvent),
  eventController.addEvent
);

module.exports = router;
