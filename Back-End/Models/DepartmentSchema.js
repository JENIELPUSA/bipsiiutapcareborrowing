const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema({
  departmentName: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model(" department", DepartmentSchema);
