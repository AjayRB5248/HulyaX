const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { PERMISSION_CONSTANTS } = require("../utility/constants");
const CompanyModel = require("../models/company.model");
const UserModel = require("../models/user.model");
const EventModel = require("../models/events.model");

const fetchPermissionList = catchAsync(async (req, res) => {
  res
    .status(httpStatus.CREATED)
    .send({ PERMISSION_CONSTANTS: Object.values(PERMISSION_CONSTANTS) });
});

const updatePermission = catchAsync(async (req, res) => {
  const { userId, permissions } = req.body;
  // Add these in middleware validators
  if (!userId)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("userId is required");
  // if (!permissions?.length)
  //   return res
  //     .status(httpStatus.INTERNAL_SERVER_ERROR)
  //     .send("Please provide permissions to update");
  const updated = await UserModel.findOneAndUpdate(
    { _id: userId },
    { $set: { permissions: permissions } },
    { new: true }
  );
  return res.status(httpStatus.CREATED).send({ updated });
});

const editEventBySuperAdmin = catchAsync(async (req, res) => {
  const eventId = req.params.eventId;
  if (!eventId)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("EventId is required");
  const payload = req.body;
  const { secondaryStatus } = payload; // this can be trending , etc...
  const updated = await EventModel.updateOne(
    { _id: eventId },
    { $set: { secondaryStatus: secondaryStatus } },
    { new: true }
  );
  return res.status(httpStatus.CREATED).send({ updated });
});

module.exports = {
  fetchPermissionList,
  updatePermission,
  editEventBySuperAdmin,
};
