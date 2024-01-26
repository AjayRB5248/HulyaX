const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');
const {  getFileMiddleware } = require('../../services/s3/s3Middleware');
const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageUsers'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

  
router
  .route("/profile-picture")
  .post(auth("manageUsers"),getFileMiddleware("profile-picture"),userController.updateProfilePicture);


router
  .route("/update-mobile")
  .post(auth("manageUsers"),validate(userValidation.updateMobileNumber),userController.updateMobilePhone)


module.exports = router;
