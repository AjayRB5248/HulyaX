const moment = require("moment");
require("moment-timezone");

const convertToUTC = (date, timeZone) => {
  return moment.tz(date, timeZone).utc();
};

const convertFromUTC = (utcDate, timeZone) => {
  return moment(utcDate).tz(timeZone).format("YYYY-MM-DD HH:mm");
};

module.exports = {
  convertFromUTC,
  convertToUTC,
};
