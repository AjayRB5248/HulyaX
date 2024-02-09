const { PERMISSION_CONSTANTS } = require("../utility/constants");

// TODO: add these roles at db level and configurable by superadmin ( superadmin should be able to modify access)
const allRoles = {
  superAdmin: Object.values(PERMISSION_CONSTANTS), // allow all permissions
  companyAdmin: [
    PERMISSION_CONSTANTS.ADD_EVENTS,
    PERMISSION_CONSTANTS.LIST_EVENTS,
    PERMISSION_CONSTANTS.EDIT_EVENTS,
    PERMISSION_CONSTANTS.PURCHASE_TICKETS,
  ],
  customer: [
    PERMISSION_CONSTANTS.MANAGE_USERS,
    PERMISSION_CONSTANTS.LIST_EVENTS,
    PERMISSION_CONSTANTS.PURCHASE_TICKETS,
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
