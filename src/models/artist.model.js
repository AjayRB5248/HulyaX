const mongoose = require("mongoose");

const artistImageSchema = {
  imageurl: {
    type: String,
  },
  isProfile: {
    type: Boolean,
  },
};

const artistSchema = mongoose.Schema(
  {
    status: {
      type: [String], // can be popular , new  etc...
      index: true,
    },
    artistName: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    artistProfile: {
      type: String,
      // required: true,
    },
    category: {
      type: String,
    },
    images: {
      type: [artistImageSchema],
    },
  },
  { timestamps: true }
);

const ArtistModel = mongoose.model("Artist", artistSchema);

module.exports = ArtistModel;
