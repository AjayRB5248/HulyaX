const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const eventController = require("../../controllers/event.controller");
const eventValidation = require("../../validations/event.validation");
const router = express.Router();
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router
  .route("/add-new-event")
  .post(
    auth("addNewEvent"),
    upload.fields([{ name: 'posterImage', maxCount: 1 }, { name: 'images', maxCount: 3 }]),
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
