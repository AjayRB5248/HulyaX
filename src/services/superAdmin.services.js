const StateModel = require("../models/states.model");
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
  const states = await StateModel.find();
  return states;
};


const listVenue = async () =>{
  const venues = await VenueModel.find().populate("state");
  return venues;
}

const addTicketService = async (user,payload) => {

  if(!payload?.eventId) throw new Error(`Event Id is required`);

  if(!payload?.venueId) throw new Error(`Venue Id is required`);

  if (!payload?.type) throw new Error(`Ticket Type is required`);

  if (!payload?.price) throw new Error(`Ticket Price is required`);

  if(!payload?.totalSeats) throw new Error(`TotalSeats is required`);


  if(user?.role === "superAdmin" && !payload?.eventOwners) throw new Error ("Provide event owner incase of superadmin");

  const currentTicket = await TicketConfigModel.findOne({
    eventId: payload.eventId,
    type : payload.type,
    venueId : payload.venueId
  });

  if(currentTicket) throw new Error ("Ticket Already Created for event ! Modify Existing Ticket");







};

module.exports = {
  listUsers,
  listStates,
  addTicketService,
  listVenue
};
