const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { PERMISSION_CONSTANTS } = require("../utility/constants");
const CompanyModel = require("../models/company.model");
const UserModel = require("../models/user.model");
const EventModel = require("../models/events.model");
const VenueModel = require("../models/venue.model");
const ArtistModel = require("../models/artist.model");
const StateModel = require("../models/states.model");

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

// venue related controllers
const addVenueBySuperAdmin = catchAsync(async (req, res) => {
  const payload = req.body.venues || {};
  const createdVenue = await VenueModel.insertMany(payload);
  return res.status(httpStatus.CREATED).send({ createdVenue });
});


const updateVenueBySuperAdmin = catchAsync(async (req, res) => {
  const venueId = req.params.venueId;
  if (!venueId)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("venueId is required");
  const payload = req.body;
  const found = await VenueModel.findById(venueId);
  if (!found) throw new Error("Venue not found");
  const updated = await VenueModel.findOneAndUpdate(
    { _id: venueId },
    { $set: payload },
    { new: true }
  ).lean();
  return res.status(httpStatus.CREATED).send({ updated });
});

const deleteVenueBySuperAdmin = catchAsync(async (req, res) => {
  const venueId = req.params.venueId;
  if (!venueId)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("venueId is required");
  const found = await VenueModel.findById(venueId);
  if (!found) throw new Error("Venue not found");
  const deleted = await VenueModel.findOneAndUpdate(
    { _id: venueId },
    { $set: { isDeleted: true } },
    { new: true }
  );
  return res.status(httpStatus.CREATED).send({ deleted });
});

//artist related controllers
const addArtist = catchAsync(async (req, res) => {
  const payload = req.body.artists;
  const savedArtists = await ArtistModel.insertMany(payload);
  return res.status(httpStatus.CREATED).send({ savedArtists });
});

const updateArtist = catchAsync(async (req, res) => {
  const artistId = req.params.artistId;
  if (!artistId)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("artistId is required");
  const payload = req.body;
  const updatePayload = { $set: payload };
  const profileImgUrl = req?.files?.primaryImages
    .map((url) => url)
    .filter(Boolean);
  if (profileImgUrl.length) {
    updatePayload.$push = {
      images: { imageurl: profileImgUrl[0], isProfile: true },
    };
  }
  const found  = await ArtistModel.findById(artistId);
  if(!found) throw new Error("Artist not found");
  const updated = await ArtistModel.findOneAndUpdate(
    { _id: artistId },
    updatePayload,
    { new: true }
  );
  return res.status(httpStatus.CREATED).send({ updated });
});

const deleteArtist = catchAsync(async (req, res) => {
  const artistId = req.params.artistId;
  if (!artistId)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("artistId is required");
  const deleted = await ArtistModel.findByIdAndUpdate(
    { _id: artistId },
    { $set: { isDeleted: true } },
    { new: true }
  );
  return res.status(httpStatus.CREATED).send({ deleted });
});


const addStatesBySuperAdmin = catchAsync(async (req, res) => {
  const payload = req.body.venues || {};
  const addedStates = await StateModel.insertMany(payload);
  return res.status(httpStatus.CREATED).send({ addedStates });
});

const updateStatesBySuperAdmin = catchAsync(async (req, res) => {
  const stateId = req.params.stateId;
  if (!stateId)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("stateId is required");
  const payload = req.body;
  const found = await StateModel.findById(stateId);
  if (!found) throw new Error("State not found");
  const updated = await StateModel.findOneAndUpdate(
    { _id: stateId },
    { $set: payload },
    { new: true }
  ).lean();
  return res.status(httpStatus.CREATED).send({ updated });
});

const deleteStatesBySuperAdmin = catchAsync(async (req, res) => {
  const stateId = req.params.stateId;
  if (!stateId)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("stateId is required");
  const found = await StateModel.findById(stateId);
  if (!found) throw new Error("State not found");
  const deleted = await StateModel.findOneAndUpdate(
    { _id: stateId },
    { $set: { isDeleted: true } },
    { new: true }
  );
  return res.status(httpStatus.CREATED).send({ deleted });
});

module.exports = {
  fetchPermissionList,
  updatePermission,
  editEventBySuperAdmin,
  addVenueBySuperAdmin,
  updateVenueBySuperAdmin,
  deleteVenueBySuperAdmin,
  addArtist,
  updateArtist,
  deleteArtist,
  addStatesBySuperAdmin,
  updateStatesBySuperAdmin,
  deleteStatesBySuperAdmin
};
