const express = require("express");
const authController = require("../Controller/authController");
const router = express.Router();
const upload = require("../middleware/fileUploader");
router.route("/signup").post(upload.single("avatar"), authController.signup);

router.route("/login").post(authController.login);

router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);

router
  .route("/getAllUsers")
  .get(
    authController.protect,
    authController.restrict("admin"),
    authController.getAllUsers,
  );

router
  .route("/getUserById")
  .get(authController.protect, authController.getUserById);

router.route("/mail-verification").post(authController.verifyOtp);

router
  .route("/updatePassword")
  .patch(authController.protect, authController.updatePassword);

router
  .route("/updateUser/:id")
  .patch(
    authController.protect,
    upload.single("avatar"),
    authController.updateUser,
  );

module.exports = router;
