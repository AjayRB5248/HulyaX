const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { PERMISSION_CONSTANTS } = require("../utility/constants");

const fetchPermissionList = catchAsync(async (req, res) => {
  const payload = req.body;
  const user = req.user;
  res.status(httpStatus.CREATED).send({ PERMISSION_CONSTANTS });
});

module.exports = {
  fetchPermissionList,
};
