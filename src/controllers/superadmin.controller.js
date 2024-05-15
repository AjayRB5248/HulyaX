const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { PERMISSION_CONSTANTS } = require("../utility/constants");
const CompanyModel = require("../models/company.model");
const UserModel = require("../models/user.model");
const EventModel = require("../models/events.model");
const VenueModel = require("../models/venue.model");
const ArtistModel = require("../models/artist.model");
const StateModel = require("../models/states.model");
const { uploadToS3Bucket } = require("../services/s3/s3Service");
const superAdminServices = require("../services/superAdmin.services");
const User = require("../models/user.model");

const fetchPermissionList = catchAsync(async (req, res) => {
  res
    .status(httpStatus.CREATED)
    .send({ PERMISSION_CONSTANTS: Object.values(PERMISSION_CONSTANTS) });
});

const fetchAllUsers = catchAsync(async (req, res) => {
  const critera = {};
  if (req?.query?.role) critera.role = req?.query?.role;
  const users = await UserModel.find(critera).lean();
  return res.status(httpStatus.CREATED).send({ users });
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
  const payload = req.body;
  const files = req.files;
  const imagesUrls = [];
  if(files.length){
    for(const buffer of files){
      const s3Location = await uploadToS3Bucket(buffer.buffer,'image/png',`artist/${buffer.originalname}`)
      imagesUrls.push({
        imageurl: s3Location?.Location,
        isProfile: buffer.fieldname === "profileImage" ? true : false,
      });
    }
    payload.images = imagesUrls;
  }
  const savedArtists = await ArtistModel.create(payload);
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
  const files = req.files;
  const imagesUrls = [];
  if (files.length) {
    for (const buffer of files) {
      const s3Location = await uploadToS3Bucket(
        buffer.buffer,
        "image/png",
        `artist/${buffer.originalname}`
      );
      imagesUrls.push({
        imageurl: s3Location?.Location,
        isProfile: buffer.fieldname === "profileImage" ? true : false,
      });
    }
    const profileImgUrl = imagesUrls.find((image) => image.isProfile)?.imageurl;
    if (profileImgUrl) {
      updatePayload.$push = {
        images: { imageurl: profileImgUrl, isProfile: true },
      };
    }
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

const fetchArtists = catchAsync(async (req, res) => {
  const payload = req?.body;
  const criteria = { isDeleted: false };
  if (payload.artistName) {
    criteria.artistName = {$regex: payload.artistName, $options: 'i'};
  }
  if (payload.category) {
    criteria.category = {$regex: payload.category, $options: 'i'};
  }
  const artists = await ArtistModel.find(criteria).lean();
  return res.status(httpStatus.CREATED).send({ artists });
});


const addStatesBySuperAdmin = catchAsync(async (req, res) => {
  const payload = req.body.states || {};
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

const fetchStates = catchAsync(async (req, res) => {
  const states = await StateModel.find({ isDeleted: false });
  return res.status(httpStatus.OK).send({ states });
})

const removeImages = catchAsync(async (req, res) => {
  const imageId = req?.params?.imageId;
  const type = req?.body?.type;
  const entityId = req?.body?.typeId;
  const criteria = {
    _id: entityId,
  };
  const updatePayload = {
    $pull: {
      images: {
        _id: imageId,
      },
    },
  };
  let removed;
  if (type === "artist") {
    removed = await ArtistModel.findOneAndUpdate(criteria, updatePayload, {
      new: true,
    });
  } else if (type === "event") {
    removed = await EventModel.findByIdAndUpdate(criteria, updatePayload, {
      new: true,
    });
  }
  return res.status(httpStatus.OK).send({ removed });
});

const approveCompany = catchAsync(async (req, res) => {
  try {
    const {userId,isApproved} = req.body;
    if (!userId)
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send("UserId is required");

    const updatedUser = await User.findByIdAndUpdate(userId,{isApproved},{new:true});

    if (!updatedUser) throw new Error("Update company failed");

    return res.status(httpStatus.CREATED).send({ updatedUser });
  } catch (error) {
    throw new Error("Update company failed");
  }
});

const listUsers = catchAsync(async (req, res) => {
  const payload = req.body;
  const users = await superAdminServices.listUsers(payload);
  res.status(httpStatus.CREATED).send({ users : Array.isArray(users) ? users : [] ,count : users?.length || 0 });
});


const listState = catchAsync(async (req, res) => {
  const states = await superAdminServices.listStates();
  res.status(httpStatus.CREATED).send({ states : Array.isArray(states) ? states : [] ,count : states?.length || 0 });
});



const listVenue = catchAsync(async (req, res) => {
  const {state : stateId} = req?.body || {};
  const venues = await superAdminServices.listVenue(stateId);
  res.status(httpStatus.CREATED).send({ venues : Array.isArray(venues) ? venues : [] ,count : venues?.length || 0 });
});


const addTickets = catchAsync(async(req,res,next)=>{
  const {user,body} = req || {};
  const addedTickets = await superAdminServices.addTicketService(user,body);
  res.status(httpStatus.CREATED).send({ ticketConfig : addedTickets  });

})


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
  fetchArtists,
  addStatesBySuperAdmin,
  updateStatesBySuperAdmin,
  deleteStatesBySuperAdmin,
  fetchStates,
  removeImages,
  fetchAllUsers,
  approveCompany,
  listUsers,
  listState,
  addTickets,
  listVenue
};
