const { statusCode, resMessage } = require("../config/constant");
const Game = require("../models/Game");
const User = require('../models/User');

exports.createBet = async (req) => {
  try {
    const { _id } = req.auth;
    const { betAmount, roomId } = req.body;

    const user = await User.findById(_id);

    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: "User not found"
      };
    }

    if (user.credit < betAmount) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Insufficient credit to place this bet"
      };
    }

    const winningAmount = Math.floor(0.8 * 2 * betAmount);

    const game = await Game.create({ createdBy: _id, betAmount, winningAmount, roomId });
    global.io.emit("new_bet", game);

    const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
    global.io.emit("games_list", updatedGames);

    return {
      status: statusCode.OK,
      success: true,
      message: "Bet created successfully",
      data: game
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};