const mongoose = require("mongoose");
const { PERMISSION_CONSTANTS } = require("../utility/constants");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  description: { type: String },
  location: { type: String },
  permissions: {
    type: [String],
    default: [],
    enum: Object.values(PERMISSION_CONSTANTS),
  },
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
