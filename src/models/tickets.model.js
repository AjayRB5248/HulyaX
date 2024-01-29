const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Ticket = mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
    },
    ticketType: {
      type: Schema.Types.ObjectId,
      ref: "TicketConfig",
    },
    bookedDate: {
      type: Date,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Events",
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const TicketModel = mongoose.model("Ticket", Ticket);

module.exports = TicketModel;
