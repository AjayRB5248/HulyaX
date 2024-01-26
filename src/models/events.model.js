const mongoose = require("mongoose");
const { toJSON } = require("./plugins");
const Schema = mongoose.Schema;

const venueSchema = {
  _id: {
    type: mongoose.Types.ObjectId,
  },
  venueName: {
    type: String,
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  // can add other details
};

// Defining the Event Schema
const eventSchema = mongoose.Schema(
  {
    // Status of the event (e.g., "Active", "Cancelled")
    status: {
      type: String,
      default : "ACTIVE",
      enum:["ACTIVE","CANCELLED","COMPLETED"],
      index: true,
      // required: true,
    },
    eventName: {
      type: String,
    },
    // Reference to the owning company's ObjectId
    eventOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    // Venue where the event takes place
    venueDetails: [venueSchema],
    slug: {
      type: String,
    },
    // Array of ticket types with reference to "ticket-configs" collection
    ticketTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: "TicketConfig",
      },
    ],
    eventImages: [
      {
        imageurl: {
          // s3 urls
          type: String,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Adding a plugin to convert the mongoose schema to JSON
eventSchema.plugin(toJSON);

// Creating the Event Model using the defined schema
const EventModel = mongoose.model("Events", eventSchema);

// Exporting the Event Model
module.exports = EventModel;
