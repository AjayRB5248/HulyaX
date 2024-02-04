// TODO: add these roles at db level and configurable by superadmin ( superadmin should be able to modify access)
const allRoles = {
  superAdmin: ["manageUsers", "listEvents", "editEvent", "purchaseTicket"],
  companyAdmin: [
    "addNewEvent",
    "manageUsers",
    "listEvents",
    "editEvent",
    "purchaseTicket",
  ],
  customer: ["manageUsers", "listEvents", "purchaseTicket"],
};

const publicRoutes = ["fetch-events"];

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
  publicRoutes,
};
