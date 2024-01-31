const moment = require("moment");
const { convertToUTC } = require("./timeZoneConverter.service");
require("moment-timezone");

moment.suppressDeprecationWarnings = true;

const eventQueryGen = {
  listEventQueryGen: (filterParams) => {
    let criteria = {};
    const { eventName, artist, city, eventDate, venueName } = filterParams;
    const convertedEventDate = convertToUTC(eventDate,`Australia/${city}`);

    // prepare elemtMatch filter if filter is related to venues
    if (city || eventDate || venueName) {
      criteria.venues = {
        $elemMatch: {},
      };
    }

    if (eventName) criteria.eventName = eventName;
    if (artist)
      criteria.artists = {
        $elemMatch: {
          artistName: {
            $regex: artist,
            $options: "i",
          },
        },
      };
    if (city) criteria.venues["$elemMatch"]["city"] = city;
    if (eventDate)
      criteria.venues["$elemMatch"]["eventDate"] = {
        $gte: new Date(convertedEventDate.startOf("day").toISOString()),
        $lte: new Date(convertedEventDate.endOf("day").toISOString()),
      };
    if (venueName)
      criteria.venues["$elemMatch"]["venueName"] = {
        $regex: venueName,
        $options: "i",
      };

    return criteria;
  },
};

module.exports = {
  eventQueryGen,
};
