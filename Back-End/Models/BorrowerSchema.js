const mongoose = require("mongoose");

const borrowerSchema = new mongoose.Schema(
  {
    avatar: {
      url: String,
      public_id: String,
    },

    rfidId: {
      type: String,
      required: true,
      unique: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },
     suffix:{
      type: String,
      required: true,
      trim: true,
    },

    contactNumber: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
    },
    laboratoryId:{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
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
