const express = require("express");
const controller = require("../controllers/paymentController");
const { responseHandler } = require("../middleware/responseHandler");
const { verifyToken } = require("../middleware/verifyToken");
const uploadPayment = require("../middleware/uploadPayment");
const validate = require("../middleware/validate");
const { createPaymentSchema, getUserPaymentsSchema } = require("../validations/paymentValidations");

const router = express.Router();

router.post("/",verifyToken, uploadPayment.single("screenshot"), validate(createPaymentSchema), responseHandler(controller.createPaymentController));

router.get("/", verifyToken, validate(getUserPaymentsSchema, "query"), responseHandler(controller.getUserPaymentsController));

module.exports = router;
