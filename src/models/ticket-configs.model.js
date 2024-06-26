const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ticketConfigSchema = mongoose.Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "SubEvents",
      required: true,
    },
    venueInfo: {
      type: mongoose.Types.ObjectId
    },
    eventOwners: [
      //companies that will own event at these states
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    type: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 0, // Ensure that the total seats are at least 1
    },
    availableSeats: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return value <= this.totalSeats;
        },
        message: "Available seats cannot be greater than total seats",
      },
    },
    soldSeats: {
      type: Number,
      default: 0,
    },

    isDeleted : {
      type: Boolean,
      default: false,
    }

  },
  {
    timestamps: true,
  }
);

const TicketConfigModel = mongoose.model("TicketConfig", ticketConfigSchema);

module.exports = TicketConfigModel;
