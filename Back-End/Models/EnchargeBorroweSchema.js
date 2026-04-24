const mongoose = require("mongoose");

const equipmentLoanSchema = new mongoose.Schema(
  {
    equipmentIds: [
      {
        equipmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "category",
          required: true,
        },
        status: {
          type: String,
          enum: ["Release", "Returned", "Pending", "In-Review","Missing","Damage"],
          default: "Pending",
        },
        serialNumber: {
          type: String,
        },
        assistsId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipment",
        },
        returnDate: {
          type: Date,
        },
        isPunchReturn: {
          type: Boolean,
          default: false,
        },
        condition: {
          type: String,
          enum: ["Ok", "Damage", "Missing"],
        },
      },
    ],
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserLoginSchema",
      required: true,
    },
    inchargeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserLoginSchema",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("LoanEquipment", equipmentLoanSchema);
