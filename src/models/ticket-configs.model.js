const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TicketConfig = mongoose.Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Events",
    },
    venueId: {
      type: mongoose.Types.ObjectId,
    },
    type: {
      type: String,
      //   required: true,
      //   default: "STANDARD",
    },
    price: {
      type: Number,
      required: true,
    },
    totalCount: {
      type: Number,
      default: 0,
    },
    purchasedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const TicketConfigModel = mongoose.model("TicketConfig", TicketConfig);

module.exports = TicketConfigModel;
