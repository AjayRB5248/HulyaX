const mongoose = require("mongoose");

const venueSchema = mongoose.Schema(
  {
    venueName: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    city: {
      type: String,
      required: true,
    },
    timeZone: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const VenueModel = mongoose.model("Venue", venueSchema);

module.exports = VenueModel;
