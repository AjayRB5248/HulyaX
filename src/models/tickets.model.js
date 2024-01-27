const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Ticket = mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
    },
    ticketType: {
      type: Schema.Types.ObjectId,
      ref: "TicketConfig",
    },
    bookedDate: {
      type: Date,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      validate: {
        validator: async function (value) {
          // Check if the user with the given _id exists and has the role 'CompanyAdmin'
          const user = await mongoose.model("User").findOne({
            _id: value,
            role: "companyAdmin",
          });

          return !!user;
        },
        message: "Company Admin not found for the given _id",
      },
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Events",
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const TicketModel = mongoose.model("Ticket", Ticket);

module.exports = TicketModel;
