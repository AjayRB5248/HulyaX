const allRoles = {
  superAdmin: ["manageUsers", "listEvents", "editEvent"],
  companyAdmin: ["addNewEvent", "manageUsers", "listEvents", "editEvent"],
  customer: ["manageUsers", "listEvents"],
};

const publicRoutes = ["fetch-events"];

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
  publicRoutes
};
