const { statusCode } = require("../config/constant");
const Game = require("../models/Game");
const User = require('../models/User');

exports.createBet = async (req) => {
  try {
    const { _id } = req.auth;
    const { betAmount } = req.body;
    
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

    const game = await Game.create({ createdBy: _id, betAmount });

    global.io.emit("new_bet", game);

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

