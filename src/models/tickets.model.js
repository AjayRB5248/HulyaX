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
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index : true
    },
    confirmationCode: {
      type: Schema.Types.Number, // or could be qr or uuid
    },
    purchasedTicket: [
      {
        uniqueId: {
          type: String,
          required : true
        },
        barcode: {
          type: String,
          required : true
        },
        isVerified : {
          type : Boolean,
          default : false
        }
      },
    ],
  },
  {
    timestamps: true,
  }
);

Ticket.index({ 'purchasedTicket.uniqueId': 1, 'purchasedTicket.barcode': 1 });

const TicketModel = mongoose.model("Ticket", Ticket);

module.exports = TicketModel;
