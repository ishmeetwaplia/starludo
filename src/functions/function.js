const User = require("../models/User"); 
const Referral = require("../models/Referral");

exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.generateUsername = (length = 5) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateRandomReferCode(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

exports.generateUniqueReferCode = async (length = 8) => {
    let code;
    let exists = true;
    while (exists) {
        code = generateRandomReferCode(length);
        const user = await User.findOne({ referCode: code }).select("_id");
        if (!user) exists = false;
    }
    return code;
}

exports.recordReferralWin = async ({ winnerId, referredById, gameId, winningAmount, betAmount = null, roomId = null }) => {
  try {
    const winAmt = Number(winningAmount) || 0;
    const betAmt = betAmount !== null ? Number(betAmount) : null;
    const referralEarning = (() => {
      if (betAmt !== null && !Number.isNaN(betAmt)) {
        return Math.round((0.02 * (2 * betAmt)) * 100) / 100;
      }
      return Math.round((winAmt * 0.02) * 100) / 100;
    })();

    const winObj = {
      game: gameId,
      winningAmount: winAmt,
      referralEarning,
      roomId,
      createdAt: new Date()
    };

    const update = {
      $push: { wins: winObj },
      $setOnInsert: { winner: winnerId, referred_by: referredById }
    };

    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const referralDoc = await Referral.findOneAndUpdate(
      { winner: winnerId, referred_by: referredById },
      update,
      opts
    );

    return {
      success: true,
      message: "Referral recorded",
      referral: referralDoc,
      addedWin: winObj
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || "Failed to record referral",
      error: err
    };
  }
};