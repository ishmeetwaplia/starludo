const { statusCode, resMessage } = require("../config/constant");
const Payment = require("../models/Payment");

exports.createPayment = async (req) => {
  try {
    const { _id } = req.auth;
    const { utrNumber, amount } = req.body;
    const file = req.file;

    // 🔹 Check if UTR already exists
    const existingPayment = await Payment.findOne({ utrNumber: utrNumber.trim() });
    if (existingPayment) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "This UTR number has already been used",
      };
    }

    const payment = await Payment.create({
      userId: _id,
      utrNumber: utrNumber.trim(),
      amount,
      screenshot: file?.path,
    });

    if (global.io) {
      global.io.emit("pending_payments_list", await Payment.find({ status: "pending" }));
      global.io.emit("new_payment", payment);
    }

    return {
      status: statusCode.OK,
      success: true,
      message: "Payment request submitted successfully",
      data: payment,
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

