const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const eventController = require("../../controllers/event.controller");
const eventValidation = require("../../validations/event.validation");
const router = express.Router();
const {
  validateEventImagesMiddleware,
} = require("../../services/s3/s3Middleware");
const { multerParser } = require("../../middlewares/multer");
const { PERMISSION_CONSTANTS } = require("../../utility/constants");

router
  .route("/add-new-event")
  .post(
    auth(PERMISSION_CONSTANTS.ADD_EVENTS),
    validateEventImagesMiddleware("posterImage", "images"),
    eventController.addEvent
  );

router
  .route("/setup-event-tickets")
  .post(
    auth(PERMISSION_CONSTANTS.SETUP_TICKETS),
    validate(eventValidation.setupEventTickets),
    eventController.setupEventTickets
  );

router.route("/fetch-events").get(
  auth(),
  // validate(eventValidation.setupEventTickets),
  eventController.listEvents
);

router.route('/edit/:eventId').put(
  auth(PERMISSION_CONSTANTS.EDIT_EVENTS),
  validateEventImagesMiddleware("posterImage", "images"),
  validate(eventValidation.editEvent),
  eventController.editEvents
)

router.route("/edit/add-event-items/:eventId").post(
  auth(PERMISSION_CONSTANTS.EDIT_EVENTS),
  validateEventImagesMiddleware("images"), // can add secondary images from here
  // validate(eventValidation.editEvent),
  eventController.addItemsToEvent
);

router
  .route("/edit/remove-event-items/:eventId")
  .delete(
    auth(PERMISSION_CONSTANTS.EDIT_EVENTS),
    multerParser,
    eventController.removeItemsFromEvent
  );

router.route('/:eventId').get(
  auth(PERMISSION_CONSTANTS.LIST_EVENTS),
  validate(eventValidation.getSingleEvents),
  eventController.getEvents
)

module.exports = router;
