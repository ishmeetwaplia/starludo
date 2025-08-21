const express = require("express");
const { responseHandler } = require("../middleware/responseHandler");
const { verifyToken } = require("../middleware/verifyToken");
const validate = require("../middleware/validate");
const validation = require("../validations/gameValidation");
const controller = require("../controllers/gameController");

const router = express.Router();

router.post("/bet", verifyToken, validate(validation.createBet), responseHandler(controller.createBetController));
router.get("/list", verifyToken, responseHandler(controller.listGamesController));

module.exports = router;
