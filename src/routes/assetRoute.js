const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assetController");

router.get("/", assetController.getAssets);
router.get("/scanners", assetController.getScanners);

module.exports = router;
