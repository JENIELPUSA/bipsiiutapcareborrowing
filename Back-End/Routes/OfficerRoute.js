const express = require("express");
const router = express.Router(); //express router
const OfficerController = require("../Controller/OfficerController");
const authController = require("./../Controller/authController");
const upload = require("../middleware/fileUploader");
router.route("/").get(authController.protect, OfficerController.DisplayOfficer);

router
  .route("/:id")
  .delete(authController.protect, OfficerController.deleteOfficer)
  .patch(
    authController.protect,
    upload.single("avatar"),
    OfficerController.UpdateOfficer,
  );

module.exports = router;
