const express = require("express");
const { handleWebhookEvent } = require("../../services/stripe");
const router = express.Router();



router
  .route("/listen")
  .post(
    handleWebhookEvent
  );



module.exports = router;
