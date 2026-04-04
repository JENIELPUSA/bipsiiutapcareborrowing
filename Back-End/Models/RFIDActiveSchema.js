const mongoose = require("mongoose");

const RFIDRegister = new mongoose.Schema(
  {
    rfidNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("RFIDRegister", RFIDRegister);
