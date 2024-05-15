const mongoose = require("mongoose");
const { toJSON } = require("./plugins");
const Schema = mongoose.Schema;
const slugify = require("slugify");
const { EVENT_STATUS } = require("../utility/constants");

const eventImageSchema = {
  imageurl: {
    type: String,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
};

const companyAssignedSchema = {
  state : {
    type : mongoose.Types.ObjectId,
    ref : "State"
  },
  companyId : {
    type : mongoose.Types.ObjectId,
    ref : "User"
  }
}

const eventSchema = mongoose.Schema(
  {
    status: {
      type: String,
      default: EVENT_STATUS.PLANNED,
      enum: Object.values(EVENT_STATUS),
      index: true,
    },
    secondaryStatus: {
      type: [String], // secondary status may be : TRENDING, SPECIAL, LIMITED
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
    states: [
      {
        type: mongoose.Types.ObjectId,
        ref: "State",
      },
    ],
    artists: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Artist",
      },
    ],
    slug: {
      type: String,
      unique: true,
    },
    images: [eventImageSchema],
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

    assignedCompany  : [companyAssignedSchema]

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
eventSchema.path("images").validate(function (value) {
  const primaryImages = value.filter((image) => image.isPrimary);
  return primaryImages.length === 1;
}, "One and only one image must be marked as primary");

eventSchema.plugin(toJSON);

const EventModel = mongoose.model("Events", eventSchema);

module.exports = EventModel;
