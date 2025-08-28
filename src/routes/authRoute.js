const express = require("express");
const controller = require("../controllers/authController");
const { responseHandler } = require("../middleware/responseHandler");
const validate = require("../middleware/validate");
const { sendOTP, verifyOTP, password , register} = require("../validations/authValidation");

const router = express.Router();

router.post("/register", validate(register), responseHandler(controller.registerController));
router.post("/resend-otp", validate(sendOTP), responseHandler(controller.resendOTPController));
router.post("/verify-otp", validate(verifyOTP),responseHandler(controller.verifyOTPController));
router.post("/password", validate(password), responseHandler(controller.passwordController));

module.exports = router;
