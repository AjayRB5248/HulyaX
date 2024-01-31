const allRoles = {
  superAdmin: ["manageUsers", "listEvents"],
  companyAdmin: ["addNewEvent", "manageUsers", "listEvents"],
  customer: ["manageUsers", "listEvents"],
};
const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
