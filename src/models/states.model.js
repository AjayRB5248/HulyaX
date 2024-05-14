const mongoose = require("mongoose");

const stateSchema = mongoose.Schema(
  {
    stateName: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    timeZone: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const StateModel = mongoose.model("State", stateSchema);

module.exports = StateModel;
