const allRoles = {
  superAdmin: [],
  companyAdmin: [],
  customer:[]
};
const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
