const { statusCode, resMessage } = require("../config/constant");
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

    const winningAmount = Math.floor(0.8 * 2 * betAmount);

    const game = await Game.create({ createdBy: _id, betAmount, winningAmount });
    global.io.emit("new_bet", game);

    setTimeout(async () => {
      await Game.findOneAndUpdate({ _id: game._id, status: "pending" }, { status: "expired" });
    }, 2 * 60 * 1000);

    const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
    if (updatedGames.length > 0) {
      global.io.emit("games_list", updatedGames);
    }

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

exports.listGames = async (req) => {
  try {
    const games = await Game.find().populate("createdBy", "username credit");

    return {
      status: statusCode.OK,
      success: true,
      message: "Games fetched successfully",
      data: games
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.room = async (req) => {
  try {
    const { roomId } = req.body;
    const game = await Game.findOne({ _id: req.auth._id, status: "pending" }).populate("createdBy", "username credit");
    if(!game){
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.No_pending_game_found_for_this_user
      };
    }

    await Game.findByIdAndUpdate(game._id, { roomId });

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Room_id_created_successfully,
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};
