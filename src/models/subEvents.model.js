const mongoose = require("mongoose");
const { EVENT_STATUS } = require("../utility/constants");

const venueShema = {
  
  venueId: {
    type: mongoose.Types.ObjectId,
    ref: "Venue",
  },
  eventDate: {
    type: Date,
    required: true,
  },
};

const subEventSchema = mongoose.Schema(
  {

    status: {
      type: String,
      default: EVENT_STATUS.PLANNED,
      enum: Object.values(EVENT_STATUS),
      index: true,
    },
    parentEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Events",
      required: true,
    },
    state: {
      type: mongoose.Types.ObjectId,
      ref: "State",
      required: true,
    },
    venues: [venueShema],
    ticketTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TicketConfig",
      },
    ],
    companies: [
      //companies that will own event at these states
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

subEventSchema.index({ companies: 1 });


const SubEventModel = mongoose.model("SubEvents", subEventSchema);

module.exports = SubEventModel;
