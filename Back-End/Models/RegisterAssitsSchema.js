// Models/RegisterAssitsSchema.js
const mongoose = require("mongoose");

const EquipmentSchema = new mongoose.Schema(
  {
    equipment: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    model: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    incharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserLoginSchema",
    },
    serialNo: {
      type: String,
      required: [true, "Serial Number is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance"],
      default: "Active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Equipment", EquipmentSchema);
