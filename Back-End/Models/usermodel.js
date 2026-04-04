const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: {
      values: ["Admin", "BHW", "Guest"],
      message: "Please select a valid role: Admin, BHW, or Guest.",
    },
    required: [true, "Please select a role."],
  },
  laboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "laboratory",
  },

  password: {
    type: String,
    required: [true, "Don't forget to Input Password"],
  },
  avatar: { type: String },

  FirstName: { type: String, required: [true, "Please Enter FirstName."] }, // First name of the user
  LastName: { type: String, required: [true, "Please Enter LastName."] }, // Last name of the user
  address: { type: String, required: [true, "Please Enter Address!"] }, // Home address of the user
  phoneNumber: { type: String }, // Contact number of the user
  dateOfBirth: {
    type: Date,
    required: [true, "Please select a Date of Birth"],
  }, // Date of birth of the user
  gender: {
    type: String,
    enum: ["Male", "Female"],
    required: [true, "Please select Gender."],
  }, // Gender of the user
  zone: { type: String },
  Designatedzone: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Mongoose pre-save middleware to hash the password and remove confirmPassword
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Hash the new password with a cost factor of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Method to compare passwords
userSchema.methods.comparePasswordInDb = async function (pswd, pswdDB) {
  return await bcrypt.compare(pswd, pswdDB);
};

// Method to check if the password was changed after the token was issued
userSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pswdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
    );
    return JWTTimestamp < pswdChangedTimestamp;
  }
  return false;
};

// Method to create a password reset token
userSchema.methods.createResetTokenPassword = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes

  return resetToken;
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
