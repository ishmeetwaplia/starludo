const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  phone: { 
    type: String,
    trim: true,
    unique: true,
  },
  email: { 
    type: String,
    trim: true,
    unique: true,
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
    type: Number,
    default: 0
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
  playingAmount: {
    type: Number,
    default: 0
  },
  updateUsername: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  securityQuestions: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true }
    }
  ]
}, { timestamps: true, versionKey: false });

UserSchema.pre("save", async function (next) {
  if (this.isModified("securityQuestions")) {
    for (let q of this.securityQuestions) {
      if (!q.answer.startsWith("$2a$") && !q.answer.startsWith("$2b$")) {
        q.answer = await bcrypt.hash(q.answer, 10);
      }
    }
  }
  next();
});

UserSchema.methods.verifyAnswer = async function (index, answer) {
  return bcrypt.compare(answer, this.securityQuestions[index].answer);
};

module.exports = mongoose.model("User", UserSchema);
