const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const eventController = require("../../controllers/event.controller");
const eventValidation = require("../../validations/event.validation");
const router = express.Router();
const { validateEventImagesMiddleware } = require("../../services/s3/s3Middleware");

router
  .route("/add-new-event")
  .post(
    auth("addNewEvent"),
    validateEventImagesMiddleware("posterImage","images"),
    eventController.addEvent
  );

router
  .route("/setup-event-tickets")
  .post(
    auth("setupTickets"),
    validate(eventValidation.setupEventTickets),
    eventController.setupEventTickets
  );

module.exports = router;
