const express = require("express");
const router = express.Router(); 
const NewsController = require("../Controller/newsController");
const authController = require("./../Controller/authController");
const upload = require("../middleware/fileUploader");
router
  .route("/")
  .get(NewsController.DisplayNews)
  .post(authController.protect,upload.single("avatar"), NewsController.AddNews);
router
  .route("/:id")
  .delete(authController.protect, NewsController.deleteNews)
  .patch(
    authController.protect,
    upload.single("avatar"),
    NewsController.UpdateNews
  );

router
  .route("/national")
   .get(NewsController.DisplayNationalNews)


module.exports = router;
