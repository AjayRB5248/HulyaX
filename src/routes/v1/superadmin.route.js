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
const { multerParser } = require("../../middlewares/multer");

router.route("/register").post(authController.register);

router
  .route("/permission-list")
  .get(superAdminCheck, superadminController.fetchPermissionList)
  .put(superAdminCheck, superadminController.updatePermission);

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

router
  .route("/artists/add-artists")
  .post(
    superAdminCheck,
    multerParser,
    validate(artistValidation.addArtist),
    superadminController.addArtist
  );
router
  .route("/artists/:artistId")
  .put(
    superAdminCheck,
    validateEventImagesMiddleware("profileImage", "images"),
    validate(artistValidation.updateArtist),
    superadminController.updateArtist
  );

router
  .route("/artists/:artistId")
  .delete(
    superAdminCheck,
    validate(artistValidation.deleteArtist),
    superadminController.deleteArtist
  );

router
  .route("/states/add-states")
  .post(
    superAdminCheck,
    multerParser,
    validate(venueValidation.addStates),
    superadminController.addStatesBySuperAdmin
  );

router
  .route("/states/:stateId")
  .put(superAdminCheck, superadminController.updateStatesBySuperAdmin);

router
  .route("/states/:stateId")
  .delete(superAdminCheck, superadminController.deleteStatesBySuperAdmin);
module.exports = router;
