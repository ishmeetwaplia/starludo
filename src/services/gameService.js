const { statusCode  , resMessage} = require("../config/constant");
const Game = require("../models/Game");
const User = require("../models/User");

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

    const existingGame = await Game.findOne({
      createdBy: _id,
      status: { $in: ["pending", "requested" ,"started"] }
    });

    if (existingGame) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "You already have an active bet. Please complete or cancel it before creating a new one."
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

exports.submitWinning = async (req) => {
  try {
    const { _id } = req.auth;
    const { gameId, result } = req.body;
    const file = req.file;

    const game = await Game.findById(gameId);
    if (!game) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.GAME_NOT_FOUND || "Game not found"
      };
    }

    if (result === "won") {
      if (!file) {
        return {
          status: statusCode.BAD_REQUEST,
          success: false,
          message: resMessage.WINNING_SCREENSHOT_REQUIRED || "Winning screenshot is required"
        };
      }

      game.winner = _id;
      game.status = "completed";
      game.winningScreenshot = file.path;
      await game.save();

      if (global.io) {
        global.io.emit("game_over", game);
      }

      return {
        status: statusCode.OK,
        success: true,
        message: resMessage.WINNING_SUBMITTED || "Winning submitted successfully",
        data: game
      };
    }

    if (result === "lost") {
      game.loser = _id;
      game.status = "completed";
      await game.save();

      if (global.io) {
        global.io.emit("game_over", game);
      }

      return {
        status: statusCode.OK,
        success: true,
        message: resMessage.GAME_MARKED_LOST || "Game marked as lost",
        data: game
      };
    }

    if (result === "cancel") {
      game.status = "quit";
      await game.save();

      if (global.io) {
        global.io.emit("game_quit", game);
      }

      return {
        status: statusCode.OK,
        success: true,
        message: resMessage.GAME_QUIT || "Game has been quit",
        data: game
      };
    }

    return {
      status: statusCode.BAD_REQUEST,
      success: false,
      message: "Invalid result value. Allowed: 'won', 'lost', or 'cancel'"
    };

  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};