const mongoose = require("mongoose");

const LaboratorySchema = new mongoose.Schema({
  laboratoryName: String,
  description: String,
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "department",
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("laboratory", LaboratorySchema);
