const mongoose = require("mongoose");
const { toJSON } = require("./plugins");
const Schema = mongoose.Schema;

const venueSchema = {
  _id: {
    type: mongoose.Types.ObjectId,
  },
  status: {
    type: String,
    // default: "coming soon",
  },
  venueName: {
    type: String,
    required: true,
  },
  dateOfEvent: {
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
      // required: true,
    },
    eventName: {
      type: String,
      index: true,
      unique: true,
    },
    // Reference to the owning company's ObjectId
    eventOwner: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    // Venue where the event takes place
    venueDetails: [venueSchema],
    slag: {
      type: String,
    },
    // Array of ticket types with reference to "ticket-configs" collection
    ticketTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: "ticket-configs",
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
