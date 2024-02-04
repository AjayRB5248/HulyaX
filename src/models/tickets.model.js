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
    ticketTypeId: {
      type: Schema.Types.ObjectId,
      ref: "TicketConfig",
    },
    bookedDate: {
      type: Date,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Events",
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    confirmationCode: {
      type: Schema.Types.Number, // or could be qr or uuid
    },
  },
  {
    timestamps: true,
  }
);

const TicketModel = mongoose.model("Ticket", Ticket);

module.exports = TicketModel;
