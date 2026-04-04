const express = require("express");
const router = express.Router(); //express router
const DepartmentController = require("../Controller/departmentController");
const authController = require("../Controller/authController");

router
  .route("/")
  .get(authController.protect, DepartmentController.getAllDepartments)
  .post(authController.protect, DepartmentController.createDepartment);

router
  .route("/:id")
  .delete(authController.protect, DepartmentController.deleteDepartment)
  .patch(authController.protect, DepartmentController.updateDepartment);

module.exports = router;
