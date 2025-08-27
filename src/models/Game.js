const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  status: {
    type: String,
    enum: ["pending", "requested", "started", "completed", "cancelled", "expired", "quit"],
    default: "pending"
  },
   adminstatus: {
    type: String,
    enum: ["notDecided", "decided"],
    default: "notDecided"
  },
  betAmount: {
    type: Number,
    required: true
  },
  winningAmount: {
    type: Number,
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  loser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  quitBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  roomId: {   
    type: String
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Game", GameSchema);
