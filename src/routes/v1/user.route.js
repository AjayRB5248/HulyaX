const express = require("express");
const { auth } = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const userValidation = require("../../validations/user.validation");
const userController = require("../../controllers/user.controller");
const { getFileMiddleware } = require("../../services/s3/s3Middleware");
const { PERMISSION_CONSTANTS } = require("../../utility/constants");
const router = express.Router();

router
  .route("/")
  .post(
    validate(userValidation.createUser),
    userController.createUser
  )
  .get(
    auth(PERMISSION_CONSTANTS.MANAGE_USERS),
    validate(userValidation.getUsers),
    userController.getUsers
  );

router
  .route("/:userId")
  .get(
    auth(PERMISSION_CONSTANTS.MANAGE_USERS),
    validate(userValidation.getUser),
    userController.getUser
  )
  .patch(
    auth(PERMISSION_CONSTANTS.MANAGE_USERS),
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    auth(PERMISSION_CONSTANTS.MANAGE_USERS),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

router
  .route("/profile-picture")
  .post(
    auth(PERMISSION_CONSTANTS.MANAGE_USERS),
    getFileMiddleware("profile-picture"),
    userController.updateProfilePicture
  );

router
  .route("/update-mobile")
  .post(
    auth(PERMISSION_CONSTANTS.MANAGE_USERS),
    validate(userValidation.updateMobileNumber),
    userController.updateMobilePhone
  );


  router.route("/update-password")
  .post(
    auth(PERMISSION_CONSTANTS.MANAGE_USERS),
    validate(userValidation.updatePassword),
    userController.updatePassword
  );

module.exports = router;
