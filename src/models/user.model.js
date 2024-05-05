const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");
const { roles } = require("../config/roles");
const { PERMISSION_CONSTANTS } = require("../utility/constants");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (
          !value.match(/\d/) ||
          !value.match(/[a-zA-Z]/) ||
          !value.match(/[!@#$%^&*(),.?":{}|<>]/)
        ) {
          throw new Error(
            "Password must contain at least one letter and one number and one special character"
          );
        }
      },
      private: true, // used by the toJSON plugin
    },
    role: {
      type: String,
      enum: roles,
      default: roles[2],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profilePicture: { type: String },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      validate(value) {
        if (!value.match(/^\+\d{1,}\s?\d+$/)) {
          throw new Error("Invalid Australian Mobile Number");
        }
      },
    },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }, // Reference to the associated company, but only for 'companyAdmin' role
    isNumberVerified: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: [String],
      default: [PERMISSION_CONSTANTS.PURCHASE_TICKETS],
      enum: Object.values(PERMISSION_CONSTANTS),
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.statics.isMobileNumberTaken = async function (
  mobileNumber,
  excludeUserId
) {
  const user = await this.findOne({
    mobileNumber,
    _id: { $ne: excludeUserId },
  });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

/**
 * @typedef User
 */
const User = mongoose.model("User", userSchema);

module.exports = User;
