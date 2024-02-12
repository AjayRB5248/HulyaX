const mongoose = require("mongoose");
const { toJSON } = require("./plugins");
const Schema = mongoose.Schema;
const slugify = require("slugify");
const { EVENT_STATUS } = require("../utility/constants");

const artistSchema = {
  artistName: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
  },
  category: {
    type: String,
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
      default: EVENT_STATUS.PLANNED,
      enum: Object.values(EVENT_STATUS),
      index: true,
    },
    secondaryStatus : {
      type : [String], // secondary status may be : TRENDING, SPECIAL, LIMITED
      index: true,
    },
    eventDescription: {
      type: String,
      required: false,
    },
    videoUrl: {
      type: String,
      required: false,
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
    artists: [artistSchema],
    venues: [venueSchema],
    slug: {
      type: String,
      // required: true,
      unique: true,
    },
    ticketTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: "TicketConfig",
      },
    ],
    eventImages: [eventImageSchema],
    tags: [
      {
        type: String,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    eventCategory: {
      type: String,
    },
  },

  {
    timestamps: true,
  }
);

// Generate slug before saving the event
eventSchema.pre("save", function (next) {
  if (this.isModified("eventName")) {
    const timestamp = Date.now();
    this.slug = slugify(`${this.eventName}-${timestamp}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

eventSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if ("eventName" in update.$set) {
    if (typeof update.$set.eventName === "string") {
      this._update.$set.slug = slugify(update.$set.eventName, {
        lower: true,
        strict: true,
      });
    }
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
