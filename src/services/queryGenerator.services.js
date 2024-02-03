const moment = require("moment");
const { convertToUTC } = require("./timeZoneConverter.service");
require("moment-timezone");

moment.suppressDeprecationWarnings = true;

const eventQueryGen = {
  listEventQueryGen: (filterParams) => {
    let criteria = {};
    const { eventName, artist, city, eventDate, venueName, eventCategory } =
      filterParams;

    // prepare elemtMatch filter if filter is related to venues
    if (city || eventDate || venueName) {
      criteria.venues = {
        $elemMatch: {},
      };
    }
    if (eventCategory)
      criteria.eventCategory = { $regex: eventCategory, $options: "i" };
    if (eventName) criteria.eventName = { $regex: eventName, $options: "i" };
    if (artist)
      criteria.artists = {
        $elemMatch: {
          artistName: {
            $regex: artist,
            $options: "i",
          },
        },
      };
    if (city)
      criteria.venues["$elemMatch"]["city"] = {
        $regex: city,
        $options: "i",
      };
    if (eventDate) {
      const convertedEventDate = convertToUTC(eventDate, `Australia/${city}`);
      criteria.venues["$elemMatch"]["eventDate"] = {
        $gte: new Date(convertedEventDate.startOf("day").toISOString()),
        $lte: new Date(convertedEventDate.endOf("day").toISOString()),
      };
    }
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
