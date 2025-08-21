const express = require("express");
const controller = require("../controllers/reviewController");
const { responseHandler } = require("../middleware/responseHandler");
const { verifyToken } = require("../middleware/verifyToken");
const validate = require("../middleware/validate");
const { create } = require("../validations/reviewValidation");

const router = express.Router();

router.post("/", verifyToken, validate(create), responseHandler(controller.createController));
router.get("/", verifyToken, responseHandler(controller.reviewListController));
router.get("/stats", verifyToken, responseHandler(controller.statsController));

module.exports = router;
