const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  viewers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userlogin",
        required: true,
      },
      isRead: {
        type: Boolean,
        default: false,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
