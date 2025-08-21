const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  betAmount: { type: Number, required: true },
  winningAmount: { type: Number, required: true }, // new field
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Game", GameSchema);
