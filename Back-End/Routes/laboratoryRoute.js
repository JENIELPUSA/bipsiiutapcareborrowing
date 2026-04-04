const express = require("express");
const router = express.Router(); //express router
const LaboratoryController = require("../Controller/laboratoryController");
const authController = require("../Controller/authController");

router
  .route("/")
  .get(authController.protect, LaboratoryController.getAllLaboratory)
  .post(authController.protect, LaboratoryController.createLaboratory);

router
  .route("/getAllLaboratorydropdown")
  .get(authController.protect, LaboratoryController.getAllLaboratorydropdown);

router
  .route("/getAllCategoryDropdown")
  .get(authController.protect, LaboratoryController.getAllCategoryDropdown);

router
  .route("/:id")
  .delete(authController.protect, LaboratoryController.deleteLaboratory)
  .patch(authController.protect, LaboratoryController.updateLaboratory);

module.exports = router;
