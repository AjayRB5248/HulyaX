const httpStatus = require("http-status");
const { Event } = require("../models");
const ApiError = require("../utils/ApiError");

const addEvent = async (payload) => {
  // TODO: add logic
  console.log(payload);
};

module.exports = {
  addEvent,
};
