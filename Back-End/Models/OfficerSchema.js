const mongoose = require("mongoose");

const OfficerSchema = new mongoose.Schema({
  avatar: {
    url: String,
    public_id: String,
  },
  first_name: String,
  last_name: String,
  middle_name: String,
  gender: { type: String, enum: ["Male", "Female"] },
  email: String,
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "department",
    default: null,
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Officer", OfficerSchema);
