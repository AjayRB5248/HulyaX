const express = require("express");
const { auth, superAdminCheck } = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const router = express.Router();
const authController = require("../../controllers/auth.controller");
const superadminController = require("../../controllers/superadmin.controller");
const {
  validateEventImagesMiddleware,
} = require("../../services/s3/s3Middleware");


router.route("/register").post(authController.register);
router
  .route("/permission-list")
  .get(superAdminCheck, superadminController.fetchPermissionList)
  .put(superAdminCheck, superadminController.updatePermission);

router.route("/events/:eventId").put(
  superAdminCheck,
  superadminController.editEventBySuperAdmin
);

module.exports = router;
