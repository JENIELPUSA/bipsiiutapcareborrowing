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
          enum: ["Release", "Returned", "Pending", "In-Review", "Missing", "Damage"],
          default: "Pending",
        },
        serialNumber: {
          type: String,
        },
        assistsId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipment",
        },
        borrowDate: {
          type: Date,
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
  }
);


// ✅ PRE SAVE (CREATE / SAVE)
equipmentLoanSchema.pre("save", function (next) {
  if (this.equipmentIds && this.equipmentIds.length > 0) {
    this.equipmentIds.forEach((item) => {

      // ✅ AUTO BORROW DATE (only if Release)
      if (item.status === "Release" && !item.borrowDate) {
        item.borrowDate = new Date();
      }

      // ✅ AUTO RETURN DATE
      if (item.status === "Returned" && !item.returnDate) {
        item.returnDate = new Date();
      }

    });
  }

  next();
});


// ✅ PRE UPDATE (findOneAndUpdate / updateOne)
equipmentLoanSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // 🔹 HANDLE $set (editing existing array)
  if (update.$set && update.$set.equipmentIds) {
    update.$set.equipmentIds = update.$set.equipmentIds.map((item) => {

      // borrow date
      if (item.status === "Release" && !item.borrowDate) {
        item.borrowDate = new Date();
      }

      // return date
      if (item.status === "Returned" && !item.returnDate) {
        item.returnDate = new Date();
      }

      return item;
    });
  }

  // 🔹 HANDLE $push (adding new equipment)
  if (update.$push && update.$push.equipmentIds) {
    let item = update.$push.equipmentIds;

    // if array push
    if (Array.isArray(item)) {
      item = item.map((i) => {
        if (i.status === "Release" && !i.borrowDate) {
          i.borrowDate = new Date();
        }
        if (i.status === "Returned" && !i.returnDate) {
          i.returnDate = new Date();
        }
        return i;
      });
      update.$push.equipmentIds = item;
    } else {
      // single object push
      if (item.status === "Release" && !item.borrowDate) {
        item.borrowDate = new Date();
      }
      if (item.status === "Returned" && !item.returnDate) {
        item.returnDate = new Date();
      }
    }
  }

  next();
});


module.exports = mongoose.model("LoanEquipment", equipmentLoanSchema);