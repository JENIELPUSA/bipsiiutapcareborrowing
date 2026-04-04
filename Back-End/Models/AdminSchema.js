const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Admin", AdminSchema);
