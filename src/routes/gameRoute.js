const express = require("express");
const { responseHandler } = require("../middleware/responseHandler");
const { verifyToken } = require("../middleware/verifyToken");
const validate = require("../middleware/validate");
const validation = require("../validations/gameValidation");
const controller = require("../controllers/gameController");
const uploadWinning = require("../middleware/uploadWinning");

const router = express.Router();

router.post("/bet", verifyToken, validate(validation.createBet), responseHandler(controller.createBetController));
router.post("/submit-winning", verifyToken, uploadWinning.single("screenshot"), validate(validation.submitWinning), responseHandler(controller.submitWinningController));
router.get("/history", verifyToken, responseHandler(controller.getUserGameHistoryController));

module.exports = router;
