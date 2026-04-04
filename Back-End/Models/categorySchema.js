const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  categoryName: String,
  discription: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("category", CategorySchema);
