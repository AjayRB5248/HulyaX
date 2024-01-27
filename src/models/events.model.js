const mongoose = require("mongoose");
const { toJSON } = require("./plugins");
const Schema = mongoose.Schema;
const slugify = require("slugify");

const artistSchema = {
  artistName: {
    type: String,
    required: true,
  },
  // Add other artist details if needed
};

const venueSchema = {
  venueName: {
    type: String,
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  timeZone: {
    type: String,
    required: true,
  },
  // Add other venue details if needed
};

const eventImageSchema = {
  imageurl: {
    type: String,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
};

const eventSchema = mongoose.Schema(
  {
    status: {
      type: String,
      default: "ACTIVE",
      enum: ["ACTIVE", "CANCELLED", "COMPLETED"],
      index: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    eventOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    artist: artistSchema,
    venues: [venueSchema],
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    ticketTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: "TicketConfig",
      },
    ],
    eventImages: [eventImageSchema],
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving the event
eventSchema.pre("save", function (next) {
  if (this.isModified("eventName")) {
    this.slug = slugify(this.eventName, { lower: true, strict: true });
  }
  next();
});

// Validate that there is one and only one primary image
eventSchema.path("eventImages").validate(function (value) {
  const primaryImages = value.filter((image) => image.isPrimary);
  return primaryImages.length === 1;
}, "One and only one image must be marked as primary");

eventSchema.plugin(toJSON);

const EventModel = mongoose.model("Events", eventSchema);

module.exports = EventModel;
