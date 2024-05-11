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
    capacity: {
      type: Number,
      required: false,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const VenueModel = mongoose.model("Venue", venueSchema);

module.exports = VenueModel;
