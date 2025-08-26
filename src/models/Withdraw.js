const mongoose = require("mongoose");

const WithdrawSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  upiId: {
    type: String,
    trim: true
  },
  bankAccount: {
    type: String,
    trim: true
  },
  ifsc: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ["unpaid", "paid", "rejected"],
    default: "unpaid"
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Withdraw", WithdrawSchema);
