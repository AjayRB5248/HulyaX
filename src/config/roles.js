const allRoles = {
  superAdmin: ["manageUsers"],
  companyAdmin: ["addNewEvent","manageUsers"],
  customer:["manageUsers"]
};
const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
