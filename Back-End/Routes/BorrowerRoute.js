const express = require("express");
const router = express.Router(); //express router
const BorrowerController = require("../Controller/BorrowerController");
const authController = require("../Controller/authController");
const upload = require("../middleware/fileUploader");

router
  .route("/")
  .get(authController.protect, BorrowerController.getAllBorrowers)
  .post(
    upload.single("avatar"),
    authController.protect,
    BorrowerController.registerBorrower
  );

router
  .route("/:id")
  .delete(authController.protect, BorrowerController.deleteBorrower)
  .patch(
    upload.single("avatar"),
    authController.protect,
    BorrowerController.updateBorrower,
  );

module.exports = router;
