const { statusCode  , resMessage} = require("../config/constant");
const Game = require("../models/Game");
const User = require("../models/User");
const path = require("path");

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
      status: { $in: ["pending", "requested", "started"] }
    });

    if (existingGame) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "You already have an active bet. Please complete or cancel it before creating a new one."
      };
    }

    if (roomId) {
      const existingRoomGame = await Game.findOne({
        roomId,
        status: { $nin: ["completed", "cancelled", "expired", "quit"] }
      });

      if (existingRoomGame) {
        return {
          status: statusCode.BAD_REQUEST,
          success: false,
          message: "This room already has an active game."
        };
      }
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

    let game = await Game.findById(gameId)
      .populate("createdBy", "username")
      .populate("acceptedBy", "username")
      .populate("winningScreenshots.user", "username");

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

      if (!game.winningScreenshots) {
        game.winningScreenshots = [];
      }

      const relativePath = path.join("uploads", "winnings", file.filename);

      game.winningScreenshots.push({
        user: _id,
        screenshot: relativePath
      });

      game.winningScreenshot = relativePath; 
      game.status = "completed"; 
      await game.save();

      // repopulate after save
      game = await Game.findById(gameId)
        .populate("createdBy", "username")
        .populate("acceptedBy", "username")
        .populate("winningScreenshots.user", "username");

      // ✅ Transform game object for socket
      const socketGame = {
        ...game.toObject(),
        createdBy: game.createdBy?._id,
        acceptedBy: game.acceptedBy?._id,
        createdByUsername: game.createdBy?.username || null,
        acceptedByUsername: game.acceptedBy?.username || null,
        winningScreenshots: game.winningScreenshots.map(ws => ({
          _id: ws._id,
          username: ws.user?.username || null,
          screenshot: ws.screenshot
        }))
      };

      if (global.io) {
        global.io.emit("game_over", socketGame);
      }

      return {
        status: statusCode.OK,
        success: true,
        message: resMessage.WINNING_SUBMITTED || "Winning submitted successfully",
        data: socketGame
      };
    }

    if (result === "lost") {
      game.loser = _id;
      game.status = "completed";
      await game.save();

      game = await Game.findById(gameId)
        .populate("createdBy", "username")
        .populate("acceptedBy", "username");

      const socketGame = {
        ...game.toObject(),
        createdBy: game.createdBy?._id,
        acceptedBy: game.acceptedBy?._id,
        createdByUsername: game.createdBy?.username || null,
        acceptedByUsername: game.acceptedBy?.username || null
      };

      return {
        status: statusCode.OK,
        success: true,
        message: resMessage.GAME_MARKED_LOST || "Game marked as lost",
        data: socketGame
      };
    }

    if (result === "cancel") {
      game.status = "quit";
      game.loser = _id;
      await game.save();

      game = await Game.findById(gameId)
        .populate("createdBy", "username")
        .populate("acceptedBy", "username");

      const socketGame = {
        ...game.toObject(),
        createdBy: game.createdBy?._id,
        acceptedBy: game.acceptedBy?._id,
        createdByUsername: game.createdBy?.username || null,
        acceptedByUsername: game.acceptedBy?.username || null
      };

      if (global.io) {
        global.io.emit("game_over", socketGame);
      }

      return {
        status: statusCode.OK,
        success: true,
        message: resMessage.GAME_QUIT || "Game has been quit",
        data: socketGame
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

exports.getUserGameHistory = async (req) => {
  try {
    const { _id } = req.auth;

    const history = await Game.find({
      $or: [
        { createdBy: _id },
        { acceptedBy: _id },
        { winner: _id },
        { loser: _id }
      ]
    }).sort({ createdAt: -1 });

    return {
      status: statusCode.OK,
      success: true,
      message: "User game history retrieved successfully",
      data: history
    };
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};