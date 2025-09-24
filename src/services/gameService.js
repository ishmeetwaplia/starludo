const { statusCode, resMessage } = require("../config/constant");
const Game = require("../models/Game");
const User = require("../models/User");
const path = require("path");

exports.createBet = async (req) => {
  try {
    const { _id } = req.auth;
    const { betAmount } = req.body;
    betAmount = Number(parseFloat(betAmount).toFixed(2));

    const user = await User.findById(_id);

    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: "User not found"
      };
    }

    const availableBalance = 
      Number(user.credit || 0) + 
      Number(user.referralEarning || 0) + 
      Number(user.winningAmount || 0) - 
      Number(user.penalty || 0);

    if (availableBalance < betAmount) {
      return {
        status: statusCode.BAD_REQUEST, 
        success: false,
        message: "Insufficient balance to place this bet"
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

    const winningAmount = Math.floor(2 * betAmount * 0.95);

    const game = await Game.create({ createdBy: _id, betAmount, winningAmount });
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

      const loserUsername = game.loser
        ? (String(game.loser) === String(game.createdBy?._id) ? game.createdBy?.username : game.acceptedBy?.username) || null
        : null;
      const quitByUsername = game.quitBy
        ? (String(game.quitBy) === String(game.createdBy?._id) ? game.createdBy?.username : game.acceptedBy?.username) || null
        : null;

      // ✅ Transform game object for socket (added loserUsername / quitByUsername)
      const socketGame = {
        ...game.toObject(),
        createdBy: game.createdBy?._id,
        acceptedBy: game.acceptedBy?._id,
        createdByUsername: game.createdBy?.username || null,
        acceptedByUsername: game.acceptedBy?.username || null,
        loserUsername,
        quitByUsername,
        winningScreenshots: game.winningScreenshots.map(ws => ({
          _id: ws._id,
          username: ws.user?.username || null,
          screenshot: ws.screenshot
        }))
      };

      if (global.io) {
        try {
          const admins = await User.find({ role: "admin" }).select("_id");
          admins.forEach((admin) => {
            const adminId = admin._id.toString();
            const sockets = global.userSocketMap?.[adminId] || [];
            sockets.forEach((socketId) => {
              global.io.to(socketId).emit("game_over", socketGame);
            });
          });
        } catch (err) {
          console.error("Error notifying admins:", err);
        }
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

      const loserUsername = game.loser
        ? (String(game.loser) === String(game.createdBy?._id) ? game.createdBy?.username : game.acceptedBy?.username) || null
        : null;

      const socketGame = {
        ...game.toObject(),
        createdBy: game.createdBy?._id,
        acceptedBy: game.acceptedBy?._id,
        createdByUsername: game.createdBy?.username || null,
        acceptedByUsername: game.acceptedBy?.username || null,
        loserUsername
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
      game.quitBy = _id;
      await game.save();

      game = await Game.findById(gameId)
        .populate("createdBy", "username")
        .populate("acceptedBy", "username");

      const quitByUsername = game.quitBy
        ? (String(game.quitBy) === String(game.createdBy?._id) ? game.createdBy?.username : game.acceptedBy?.username) || null
        : null;

      const socketGame = {
        ...game.toObject(),
        createdBy: game.createdBy?._id,
        acceptedBy: game.acceptedBy?._id,
        createdByUsername: game.createdBy?.username || null,
        acceptedByUsername: game.acceptedBy?.username || null,
        quitByUsername
      };

      if (global.io) {
        try {
          const admins = await User.find({ role: "admin" }).select("_id");
          admins.forEach((admin) => {
            const adminId = admin._id.toString();
            const sockets = global.userSocketMap?.[adminId] || [];
            sockets.forEach((socketId) => {
              global.io.to(socketId).emit("game_over", socketGame);
            });
          });
        } catch (err) {
          console.error("Error notifying admins:", err);
        }
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

    let history = await Game.find({
      $or: [
        { createdBy: _id },
        { acceptedBy: _id },
        { winner: _id },
        { loser: _id }
      ]
    }).sort({ createdAt: -1 });

    history = history.map((game) => {
      const gameObj = game.toObject();

      if (game.adminstatus === "notDecided") {
        gameObj.decision = "notDecided";

      } else if (game.winner) {
        const winnerId = game.winner?.toString();
        const loserId = game.loser?.toString?.();

        if (winnerId === _id.toString()) {
          gameObj.decision = "win";
        } else if (!winnerId) {
          gameObj.decision = "quit";
        } else {
          gameObj.decision = "lost";
        }
      }
      return gameObj;
    });

    return {
      status: statusCode.OK,
      success: true,
      message: "User game history retrieved successfully",
      data: history
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};
