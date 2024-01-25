const { Event } = require("../models");

const eventQueryServices = {
  updateMultiEvent: async (updateCriteria, updatePayload) => {
    return await Event.updateMany(updateCriteria, updatePayload);
  },
  updateEvent: async (updateCriteria, updatePayload) => {
    return await Event.updateOne(updateCriteria, updatePayload);
  },
};

module.exports = {
  eventQueryServices,
};
