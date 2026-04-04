const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "ARCHIVE",
        "RESTORE",
        "LOGIN",
        "LOGOUT",
        "REVIEW",
        "APPROVE",
        "REJECTED",
      ],
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "performedByModel",
    },
    performedByModel: {
      type: String,
      required: true,
      enum: ["Admin", "Officer"],
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Files",
    },
    reason: {
      type: String,
      trim: true,
    },
    beforeChange: {
      type: Object,
    },
    afterChange: {
      type: Object,
    },
    message: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: ["info", "warning", "error"],
      default: "info",
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
