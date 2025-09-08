const express = require("express");
const controller = require("../controllers/authController");
const { responseHandler } = require("../middleware/responseHandler");
const validate = require("../middleware/validate");
const { sendOTP, verifyOTP, password, register, login, forgotPassword, verifyForgotPassword } = require("../validations/authValidation");

const router = express.Router();

router.post("/register", validate(register), responseHandler(controller.registerController));
router.post("/resend-otp", validate(sendOTP), responseHandler(controller.resendOTPController));
router.post("/verify-otp", validate(verifyOTP),responseHandler(controller.verifyOTPController));
router.post("/password", validate(password), responseHandler(controller.passwordController));
router.post("/login", validate(login), responseHandler(controller.loginController));
router.post('/forgot-password', validate(forgotPassword), responseHandler(controller.forgotPasswordController));
router.post('/verify-forgot-password', validate(verifyForgotPassword), responseHandler(controller.verifyForgotPasswordController));

module.exports = router;
