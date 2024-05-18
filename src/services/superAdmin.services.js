const StateModel = require("../models/states.model");
const SubEventModel = require("../models/subEvents.model");
const TicketConfigModel = require("../models/ticket-configs.model");
const User = require("../models/user.model");
const VenueModel = require("../models/venue.model");

const listUsers = async (payload) => {
  try {
    const { email, limit, page, role } = payload || {}; // Extract filters from query params

    // Pagination
    const perPage = parseInt(limit) || 10;
    const pageNumber = parseInt(page) || 1;
    const skip = (pageNumber - 1) * perPage;
    const userCriteria = {
      role,
    };

    if (email) userCriteria.email = { $regex: email, $options: "i" };

    const companyPipeline = [
      {
        $match: userCriteria,
      },

      { $sort: { createdAt: -1 } }, // Sort by createdAt
      { $skip: skip }, // Pagination - skip
      { $limit: perPage }, // Pagination - limit
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          mobileNumber: 1,
          isNumberVerified: 1,
          isApproved: 1,
          permissions: 1,
          name: 1,
          role: 1,
        },
      },
    ];
    const companyPipelineWithoutEmptyObjects = companyPipeline.filter(
      (stage) => Object.keys(stage).length > 0
    );

    const companies = await User.aggregate(companyPipelineWithoutEmptyObjects);

    return companies;
  } catch (error) {
    throw new Error(error.message);
  }
};

const listStates = async () => {
  let criteria = {isDeleted: false};
  const states = await StateModel.find(criteria);
  return states;
};

const listVenue = async (stateId) => {
  let critera = {};
  if (stateId) critera.state = stateId;
  critera.isDeleted  = false ;

  const venues = await VenueModel.find(critera).populate("state");
  return venues;
};

const addTicketService = async (user, payload) => {
  if (!payload?.eventId) throw new Error(`Event Id is required`);

  if (!payload?.venueInfo) throw new Error(`Venue Id is required`);

  if (!payload?.type) throw new Error(`Ticket Type is required`);

  if (!payload?.price) throw new Error(`Ticket Price is required`);

  if (!payload?.totalSeats) throw new Error(`TotalSeats is required`);

  if (user?.role === "superAdmin" && !payload?.eventOwners)
    throw new Error("Provide event owner incase of superadmin");

  if (user?.role === "companyAdmin" && user?.isApproved === false)
    throw new Error("Company must be registered");

  const eventOwners = payload?.eventOwners || req?.user?._id;

  const assignedEvent = await SubEventModel.findById(payload?.eventId);

  if (!assignedEvent) throw new Error("Event must be registered !");

  const currentTicket = await TicketConfigModel.findOne({
    eventId: payload.eventId,
    type: payload.type,
    venueInfo: payload.venueInfo,
    isDeleted: false,
  });

  if (currentTicket)
    throw new Error(
      "Ticket Already Created for event ! Modify Existing Ticket"
    );

  const createdTickets = await TicketConfigModel.create({
    eventId: payload?.eventId,
    venueInfo: payload?.venueInfo,
    eventOwners: [eventOwners],
    type: payload?.type,
    price: payload?.price,
    totalSeats: payload?.totalSeats,
    availableSeats: payload?.totalSeats,
  });

  await SubEventModel.findOneAndUpdate({_id:payload?.eventId},{$push:{ticketTypes:createdTickets?._id}})

  return createdTickets;
};

const updateTicketService = async (user, payload) => {
  if (!["superAdmin", "companyAdmin"]?.includes(user.role))
    throw new Error("Restricted routes");

  let updateObject = {};

  if (!payload?.ticketConfigId)
    throw new Error("Please provide TicketConfigId !");

  const currentTicket = TicketConfigModel.findById(
    payload?.ticketConfigId
  ).populate("eventOwners venueId eventId");

  if (
    user?.role === "companyAdmin" &&
    !currentTicket?.eventOwners?.includes(user?._id)
  )
    throw new Error("Update Your Ticket !");

  if (payload?.type) updateObject.type = payload.type;

  if (payload?.totalSeats) updateObject.totalSeats = payload.totalSeats;

  if (payload?.price) updateObject.price = payload.price;

  const updatedTickets = await TicketConfigModel.findByIdAndUpdate(
    payload?.ticketConfigId,
    { $set: updateObject },
    { new: true }
  );

  return updatedTickets;
};



const updateVenueSubEvent = async (user, payload) => {
  // if (!["superAdmin", "companyAdmin"]?.includes(user.role))
  //   throw new Error("Restricted user");

  const { subEventId, venues } = payload || {};

  if (!subEventId || !venues) throw new Error("Invalid Payload");

  const currentSubEvent = await SubEventModel.findById(subEventId);

  if (
    user.role === "companyAdmin" &&
    !currentSubEvent?.companies?.includes(user?._id)
  )
    throw new Error("Update Your Own Event");

  const updatedEvent = await SubEventModel.findByIdAndUpdate(
    subEventId,
    { $set: { venues } },
    { new: true }
  );

  return updatedEvent;
};


const deleteTickets = async (user, payload) => {

  if (user.role === "companyAdmin"){
    const currentTicket = await TicketConfigModel.findById(payload?.ticketConfigId).select("eventOwners");
    if(!currentTicket?.eventOwners?.includes(user?._id)) throw new Error ("Delete Your Own Ticket Bitch !");
  }

  if (!payload?.ticketConfigId) throw new Error("Enter ticket Id");
  const deletedTicket = await TicketConfigModel.findByIdAndUpdate(payload?.ticketConfigId, {
    $set: { isDeleted: true },
  },{new:true});

  await SubEventModel.findOneAndUpdate({_id:deletedTicket?.eventId},{$pull:{ticketTypes:deletedTicket?._id}})

  return true;
};

module.exports = {
  listUsers,
  listStates,
  addTicketService,
  listVenue,
  updateTicketService,
  deleteTickets,
  updateVenueSubEvent
};
