const mongoose = require("mongoose");

const borrowerSchema = new mongoose.Schema(
  {
    rfidId: {
      type: String,
      required: true,
      unique: true,
    },
    contactNumber: {
      type: String,
      unique: true,
    },
    address: {
      type: String,
    },
    linkedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserLoginSchema",
    },

    borrowerType: {
      type: String,
      enum: ["student", "employee", "external"],
      default: "external",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blacklisted"],
      default: "active",
    },

    borrowedItems: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipment",
        },
        borrowedDate: {
          type: Date,
          default: Date.now,
        },
        returnDate: Date,
        status: {
          type: String,
          enum: ["borrowed", "returned", "overdue"],
          default: "borrowed",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Borrower", borrowerSchema);
