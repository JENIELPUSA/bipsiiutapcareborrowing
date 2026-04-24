const express = require("express");
const router = express.Router(); //express router
const EquipmentRoute = require("../Controller/EquipmentController");
const authController = require("../Controller/authController");

router
  .route("/")
  .get(authController.protect, EquipmentRoute.getAllEquipment)
  .post(authController.protect, EquipmentRoute.createEquipment)
router
  .route("/getDashboardCounts")
  .get(authController.protect, EquipmentRoute.getDashboardCounts)
router
  .route("/:id")
  .get(authController.protect, EquipmentRoute.getEquipmentById)
  .delete(authController.protect, EquipmentRoute.deleteEquipment)
  .patch(authController.protect, EquipmentRoute.updateEquipment);



module.exports = router;
