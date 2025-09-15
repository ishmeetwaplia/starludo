const mongoose = require("mongoose");

const ReferralWinSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
    required: true
  },
  winningAmount: {
    type: Number,
    required: true,
    default: 0
  },
  referralEarning: {
    type: Number,
    required: true,
    default: 0
  },
  roomId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ReferralSchema = new mongoose.Schema({
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  wins: {
    type: [ReferralWinSchema],
    default: []
  }
}, { timestamps: true, versionKey: false });

ReferralSchema.index({ winner: 1, referred_by: 1 }, { unique: true });

module.exports = mongoose.model("Referral", ReferralSchema);
