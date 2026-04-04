const express = require("express");
const router = express.Router(); //express router
const CategoryController = require("../Controller/categoryController");
const authController = require("../Controller/authController");

router
  .route("/")
  .get(authController.protect, CategoryController.getAllCategory)
  .post(authController.protect, CategoryController.createCategory);

router
  .route("/:id")
  .delete(authController.protect, CategoryController.deleteCategory)
  .patch(authController.protect, CategoryController.updateCategory);

router
  .route("/dropdown")
  .get(authController.protect, CategoryController.categoryDropdown);

module.exports = router;
