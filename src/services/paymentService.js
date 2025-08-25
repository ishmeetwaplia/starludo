const { statusCode, resMessage } = require("../config/constant");
const Payment = require("../models/Payment");

exports.createPayment = async (req) => {
  try {
    const { _id } = req.auth;
    const { utrNumber, amount } = req.body;
    const file = req.file;

    if (!utrNumber || !amount || !file) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "UTR number, amount and screenshot are required",
      };
    }

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
      screenshot: file.path,
    });

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

exports.getUserPayments = async (req) => {
  try {
    const { _id } = req.auth;
    const payments = await Payment.find({ userId: _id }).sort({ createdAt: -1 });

    return {
      status: statusCode.OK,
      success: true,
      message: "Payments fetched successfully",
      data: payments,
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};
