const express = require("express");
const router = express.Router(); //express router
const EnchargeBorrowerController = require("../Controller/EnchargedBorrow");
const authController = require("../Controller/authController");

router
  .route("/")
  .get(authController.protect, EnchargeBorrowerController.getAllLoans)
  .post(authController.protect, EnchargeBorrowerController.createLoan);

router
  .route("/getLatestEquipment")
  .get(authController.protect, EnchargeBorrowerController.getLatestEquipment);

router
  .route("/:id")
  .delete(authController.protect, EnchargeBorrowerController.deleteLoan)
  .patch(authController.protect, EnchargeBorrowerController.updateLoan);

router
  .route("/rfidData/:rfidData")
  .get(authController.protect, EnchargeBorrowerController.useRFidGet);
router
  .route("/rfidData/:rfidData")
  .get(authController.protect, EnchargeBorrowerController.useRFidGet);

router
  .route("/getSpecificData")
  .get(authController.protect, EnchargeBorrowerController.getSpecificData);

router
  .route("/generateReport")
  .get(authController.protect, EnchargeBorrowerController.generateReport);

router
  .route("/ReturnLoan/:id")
  .patch(authController.protect, EnchargeBorrowerController.ReturnLoan);

module.exports = router;
