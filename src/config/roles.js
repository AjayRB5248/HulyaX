const allRoles = {
  superAdmin: [],
  companyAdmin: ["addNewEvent", "setupTickets"],
  customer: [],
};
const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
