const express = require("express");
const { auth, superAdminCheck } = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const venueValidation = require("../../validations/venue.validation");
const artistValidation = require("../../validations/artist.validation");
const router = express.Router();
const authController = require("../../controllers/auth.controller");
const superadminController = require("../../controllers/superadmin.controller");
const {
  validateEventImagesMiddleware,
} = require("../../services/s3/s3Middleware");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { multerParser, formDataAndImageParserMiddleware, multerUpload } = require("../../middlewares/multer");
const Joi = require("joi");
const eventController = require("../../controllers/event.controller");

router.route("/register").post(authController.register);

router
  .route("/permission-list")
  .get(superAdminCheck, superadminController.fetchPermissionList)
  .put(superAdminCheck, superadminController.updatePermission);


router
  .route("/fetch-all-users")
  .get(superAdminCheck, superadminController.fetchAllUsers);

router
  .route("/events/:eventId")
  .put(superAdminCheck, superadminController.editEventBySuperAdmin);

router
  .route("/venues/add-venues")
  .post(
    superAdminCheck,
    multerParser,
    validate(venueValidation.addVenue),
    superadminController.addVenueBySuperAdmin
  );

router
  .route("/venues/:venueId")
  .put(
    superAdminCheck,
    multerParser,
    validate(venueValidation.updateVenue),
    superadminController.updateVenueBySuperAdmin
  );

router
  .route("/venues/:venueId")
  .delete(
    superAdminCheck,
    multerParser,
    validate(venueValidation.deleteVenue),
    superadminController.deleteVenueBySuperAdmin
  );

/* state related apis */
router
  .route("/artists/fetch-artist")
  .post(
    superAdminCheck,
    superadminController.fetchArtists
  );


router
  .route("/artists/add-artist")
  .post(
    superAdminCheck,
    upload.any(),
    superadminController.addArtist
  );

router
  .route("/artists/:artistId")
  .put(
    superAdminCheck,
    upload.any(),
    // validate(artistValidation.updateArtist),
    superadminController.updateArtist
  );

router
  .route("/artists/:artistId")
  .delete(
    superAdminCheck,
    validate(artistValidation.deleteArtist),
    superadminController.deleteArtist
  );

/* state related apis */
router
  .route("/states/add-states")
  .post(
    superAdminCheck,
    validate(venueValidation.addStates),
    superadminController.addStatesBySuperAdmin
  );

router
  .route("/states/:stateId")
  .put(superAdminCheck, superadminController.updateStatesBySuperAdmin);

router
  .route("/states/:stateId")
  .delete(superAdminCheck, superadminController.deleteStatesBySuperAdmin);

router
  .route("/states/list")
  .get(superAdminCheck, superadminController.fetchStates);


//remove images related apis for all
router.route("/images/:imageId").delete(
  superAdminCheck,
  validate({
    body: Joi.object().keys({
      type: Joi.string()
        .valid(...["artist", "event"])
        .required(),
      typeId: Joi.string()
        .required()
        .description("id of the artist or event to remove images"),
    }),
  }),
  superadminController.removeImages
);

router
  .route("/add-new-event")
  .post(
    superAdminCheck,
    upload.any(),
    eventController.addEvent
  );

router
  .route("/assign-companies-to-events")
  .post(superAdminCheck, eventController.assignCompaniesToEvents);

router
  .route("/fetch-all-events")
  .get(superAdminCheck, eventController.listEvents);

module.exports = router;
