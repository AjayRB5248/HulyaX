const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Ticket = mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      default: "PENDING",
    },
    ticketType: {
      type: Schema.Types.ObjectId,
    },
    bookedDate: {
      type: Date,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      //   ref: "company", --> lets not add ref for now
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
