const express = require("express");
const { auth } = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const eventController = require("../../controllers/event.controller");
const eventValidation = require("../../validations/event.validation");
const router = express.Router();
const {
  validateEventImagesMiddleware,
} = require("../../services/s3/s3Middleware");
const { multerParser } = require("../../middlewares/multer");
const { PERMISSION_CONSTANTS } = require("../../utility/constants");



router.route("/view-assigned-events")
.post(auth(),validate(eventValidation.viewAssignedEvents),eventController.viewAssignedEvents)

// router
//   .route("/add-new-event")
//   .post(
//     auth(PERMISSION_CONSTANTS.ADD_EVENTS),
//     validateEventImagesMiddleware("posterImage", "images"),
//     eventController.addEvent
//   );

// router
//   .route("/setup-event-tickets")
//   .post(
//     auth(PERMISSION_CONSTANTS.SETUP_TICKETS),
//     validate(eventValidation.setupEventTickets),
//     eventController.setupEventTickets
//   );

// this is public route
router.route("/fetch-events").get(
  auth(),
  eventController.listEvents
);

// router
//   .route("/edit/:eventId")
//   .put(
//     auth(PERMISSION_CONSTANTS.EDIT_EVENTS),
//     validateEventImagesMiddleware("posterImage", "images"),
//     validate(eventValidation.editEvent),
//     eventController.editEvents
//   );

// router.route("/edit/add-event-items/:eventId").post(
//   auth(PERMISSION_CONSTANTS.EDIT_EVENTS),
//   validateEventImagesMiddleware("images"), // can add secondary images from here
//   // validate(eventValidation.editEvent),
//   eventController.addItemsToEvent
// );

// router
//   .route("/edit/remove-event-items/:eventId")
//   .delete(
//     auth(PERMISSION_CONSTANTS.EDIT_EVENTS),
//     multerParser,
//     eventController.removeItemsFromEvent
//   );

router
  .route("/:eventId")
  .get(
    auth(),
    eventController.getEvents
  );

  router
  .route("/fetch-subEvent-by-parent-event/:eventId")
  .get(
    // auth(),
    eventController.getSubEvents
  );

// router.route("/event-status-list").get(
//   // auth(PERMISSION_CONSTANTS.LIST_EVENTS),
//   eventController.getEventStatuses
// );

// // get possible event venues
// router
//   .route("/event-venues-list")
//   .get(
//     auth(PERMISSION_CONSTANTS.ADD_EVENTS), 
//     eventController.getPossibleEventVenues
//   );

// // get possible event artists
// router
//   .route("/event-venues-list")
//   .get(
//     auth(PERMISSION_CONSTANTS.ADD_EVENTS),
//     eventController.getPossibleEventArtists
//   );

// router.route('/:eventId').delete(
//   auth(PERMISSION_CONSTANTS.EDIT_EVENTS),
//   validate(eventValidation.getSingleEvents),
//   eventController.deleteEvent
// )

module.exports = router;
