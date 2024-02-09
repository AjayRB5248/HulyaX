const express = require("express");
const { auth, superAdminCheck } = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const router = express.Router();
const authController = require("../../controllers/auth.controller");
const superadminController = require("../../controllers/superadmin.controller");
const {
  validateEventImagesMiddleware,
} = require("../../services/s3/s3Middleware");
const { PERMISSION_CONSTANTS } = require("../../utility/constants");
router.route("/register").post(authController.register);
router
  .route("/permission-list")
  .get(superAdminCheck, superadminController.fetchPermissionList);

module.exports = router;
