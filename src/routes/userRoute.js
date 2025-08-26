const express = require("express");
const controller = require("../controllers/userController");
const { responseHandler } = require("../middleware/responseHandler");
const { verifyToken } = require("../middleware/verifyToken");
const validate = require("../middleware/validate");
const { credit } = require("../validations/userValidation");

const router = express.Router();

router.get("/profile", verifyToken, responseHandler(controller.profileController));
router.put("/profile", verifyToken, responseHandler(controller.updateProfileController));
router.get("/logout", verifyToken, responseHandler(controller.logoutController));
router.post("/credit", verifyToken, validate(credit), responseHandler(controller.addCreditController));
router.get("/credit", verifyToken, responseHandler(controller.getCreditController));
router.get("/payments", verifyToken, responseHandler(controller.getUserPaymentsController));

module.exports = router;
