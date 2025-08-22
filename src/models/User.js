const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phone: { 
    type: String,
    trim: true,
    unique: true,
    required: true
  },
  otp: { 
    type: String,
    trim: true
  }, 
  otpExpire: { type: Date },
  token: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    trim: true,
    select: false
  },
  profile: String,
  username: {
    type: String,
    trim: true,
  },
  referCode: {
    type: String,
    trim: true
  },
  cashWon: {
    type: String,
    default: "0"
  },
  battlePlayed: {
    type: String,
    default: "0"
  },
  referralEarning: {
    type: String,
    default: "0"
  },
  penalty: {
    type: String,
    default: "0"
  },
  winningAmount: {
    type: String,
    default: "0"
  },
  completedGames: {
    type: String,
    default: "0"
  },
  referRank: {
    type: String,
    default: "0"
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
   credit: {
    type: Number,
    default: 0
  },
  isBanned: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  fullName: { type: String },         
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("User", UserSchema);
