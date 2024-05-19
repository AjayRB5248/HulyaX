const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  description: { type: String },
  location: { type: String },
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
