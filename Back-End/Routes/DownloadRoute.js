const express = require("express");
const router = express.Router(); 
const DownloadController = require("../Controller/AgentController");
const authController = require("./../Controller/authController");
const upload = require("../middleware/fileUploader");

router
  .route("/")
   .get(DownloadController.downloadAgent)


module.exports = router;
