const { Server } = require("socket.io");
const Game = require("./src/models/Game");
const Payment = require("./src/models/Payment");
const User = require("./src/models/User");
const Withdraw = require("./src/models/Withdraw");

function initSocket(server) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Map of userId => array of socketIds
  const userSocketMap = {};

  // Helper functions
  async function emitGamesList() {
    const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } })
      .populate("createdBy", "username credit");
    io.emit("games_list", updatedGames);
  }

  async function emitLiveGames() {
    const liveGames = await Game.find({ status: "started" })
      .populate("createdBy", "username credit")
      .populate("acceptedBy", "username credit");
    io.emit("live_games", liveGames);
  }

  // Interval to check game status every 10 seconds
  setInterval(async () => {
    try {
      const now = new Date();

      // Expire pending/requested games older than 5 min
      const expiredPendingGames = await Game.updateMany(
        { status: { $in: ["pending", "requested"] }, createdAt: { $lt: new Date(now - 5 * 60 * 1000) } },
        { status: "expired" }
      );

      // Complete started games older than 15 min
      const completedGames = await Game.updateMany(
        { status: "started", createdAt: { $lt: new Date(now - 15 * 60 * 1000) } },
        { status: "completed" }
      );

      // Cancel inactive started games older than 20 min since last update
      const inactiveGames = await Game.find({
        status: "started",
        updatedAt: { $lt: new Date(now - 20 * 60 * 1000) },
      }).populate("createdBy", "_id").populate("acceptedBy", "_id");

      for (const game of inactiveGames) {
        game.status = "cancelled";
        await game.save();

        const creatorSockets = userSocketMap[game.createdBy?._id?.toString()] || [];
        const accepterSockets = userSocketMap[game.acceptedBy?._id?.toString()] || [];

        [...creatorSockets, ...accepterSockets].forEach(socketId => {
          io.to(socketId).emit("game_over", {
            gameId: game._id,
            status: game.status,
            message: "Game cancelled due to inactivity",
          });
        });
      }

      // Emit updates to clients
      await emitGamesList();
      await emitLiveGames();

    } catch (err) {
      console.error("Error in game status interval:", err);
    }
  }, 10000); // every 10 seconds

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    // Register user socket
    socket.on("register_user", async (userId) => {
      if (!userSocketMap[userId]) userSocketMap[userId] = [];
      userSocketMap[userId].push(socket.id);
      socket.userId = userId;
      console.log("===========userSocketMap", JSON.stringify(userSocketMap, null, 2));
      global.userSocketMap = userSocketMap;
      await emitGamesList();
    });

    // Delete game
    socket.on("delete_game", async (gameId) => {
      try {
        await Game.findByIdAndDelete(gameId);
        await emitGamesList();
      } catch (error) {
        console.error("Error deleting game:", error);
      }
    });

    // Accept game request
    socket.on("accept_game_request", async ({ gameId, userId }) => {
      try {
        const game = await Game.findById(gameId).populate("createdBy", "username");
        if (!game) return;

        const acceptingUser = await User.findById(userId);
        if (!acceptingUser) {
          return 
        }

        if ((Number(acceptingUser.credit || 0) + Number(acceptingUser.referralEarning || 0)) < Number(game.betAmount || 0)) {
          return; 
        }

        const updatedGame = await Game.findByIdAndUpdate(
          gameId,
          { status: "requested", acceptedBy: userId },
          { new: true }
        ).populate("createdBy", "username");

        if (!updatedGame) return;

        const creatorSockets = userSocketMap[updatedGame.createdBy._id.toString()] || [];
        creatorSockets.forEach(socketId => {
          io.to(socketId).emit("game_accepted", {
            gameId,
            acceptedBy: userId,
          });
        });

        await emitGamesList();
      } catch (error) {
        console.error("Error accepting game:", error);
      }
    });

    // Cancel game request
    socket.on("cancel_game_request", async (gameId) => {
      try {
        const game = await Game.findById(gameId).populate("acceptedBy", "_id username");
        if (!game || !game.acceptedBy) return;

        const accepterSockets = userSocketMap[game.acceptedBy._id.toString()] || [];
        accepterSockets.forEach(socketId => {
          io.to(socketId).emit("game_request_canceled", {
            gameId,
            message: "The creator has canceled the game request.",
          });
        });

        await Game.findByIdAndUpdate(gameId, { status: "cancelled", acceptedBy: null });
        await emitGamesList();
      } catch (error) {
        console.error("Error canceling game request:", error);
      }
    });

    // Start game
    socket.on("start_game", async (gameId) => {
      try {
        const game = await Game.findById(gameId)
          .populate("createdBy", "_id username credit")
          .populate("acceptedBy", "_id username credit");

        if (!game || !game.acceptedBy) return;

        const accepterSockets = userSocketMap[game.acceptedBy._id.toString()] || [];
        accepterSockets.forEach(socketId => {
          io.to(socketId).emit("start_game", {
            gameId,
            roomId: game.roomId,
            message: "The creator has started the game.",
          });
        });

        const betAmount = game.betAmount;
        await Promise.all([
          User.findByIdAndUpdate(game.createdBy._id, { $inc: { credit: -betAmount } }),
          User.findByIdAndUpdate(game.acceptedBy._id, { $inc: { credit: -betAmount } }),
        ]);

        await Game.findByIdAndUpdate(gameId, { status: "started" });

        await emitGamesList();
        await emitLiveGames();
      } catch (error) {
        console.error("Error starting game:", error);
      }
    });

    // Payment status update
    socket.on("update_payment_status", async ({ paymentId, status }) => {
      try {
        if (!["approved", "rejected", "pending"].includes(status)) return;

        const payment = await Payment.findById(paymentId).populate("userId", "username credit");
        if (!payment) return;

        payment.status = status;
        await payment.save();
        if (status === "approved" && payment.userId) {
          const user = payment.userId;
          const currentCredit = parseFloat(user.credit || "0"); // convert string to number
          const newCredit = currentCredit + payment.amount;

          // save back as string
          user.credit = newCredit.toString();
          await user.save();
        }

        const userSockets = userSocketMap[payment.userId._id.toString()] || [];
        userSockets.forEach(socketId => {
          io.to(socketId).emit("payment_update", {
            message: `Your payment has been ${status}`,
            payment,
          });
        });
      } catch (error) {
        console.error("Error updating payment:", error);
      }
    });

    // Withdraw status update
    socket.on("update_withdraw_status", async ({ withdrawId, status }) => {
      try {
        if (!["paid", "rejected"].includes(status)) return;

        const withdraw = await Withdraw.findById(withdrawId).populate("userId", "username winningAmount");
        if (!withdraw) return;

        withdraw.status = status;
        await withdraw.save();

        if (status === "paid" && withdraw.userId) {
          const user = await User.findById(withdraw.userId._id);
          if (user) {
            const oldAmount = Number(user.winningAmount) || 0;
            const newAmount = Math.max(0, oldAmount - Number(withdraw.amount));
            user.winningAmount = String(newAmount);
            await user.save();
          }
        }
      } catch (error) {
        console.error("Error updating withdraw status:", error);
      }
    });

    // Admin winner decision
    socket.on("admin_winner_decision", async ({ gameId, winner }) => {
      try {
        const game = await Game.findById(gameId)
          .populate("createdBy", "_id username")
          .populate("acceptedBy", "_id username");

        if (!game) return socket.emit("error_message", { message: "Game not found" });
        if (game.adminstatus === "decided") return socket.emit("error_message", { message: "Game already decided" });

        if (![game.createdBy._id.toString(), game.acceptedBy._id.toString()].includes(winner)) {
          return socket.emit("error_message", { message: "Winner must be one of the players" });
        }

        const loserId = game.createdBy._id.toString() === winner ? game.acceptedBy._id : game.createdBy._id;
        game.winner = winner;
        game.loser = loserId;
        game.adminstatus = "decided";
        game.status = "completed";
        await game.save();

        const user = await User.findById(winner);
        if (user) {
          const newAmount = (Number(user.winningAmount) || 0) + Number(game.winningAmount || 0);
          user.winningAmount = String(newAmount);
          await user.save();

          if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer && referrer.isActive && !referrer.isBanned) {
              const bet = Number(game.betAmount) || 0;
              const referBonus = 0.02 * (2 * bet);
              referrer.referralEarning = (Number(referrer.referralEarning || 0) + referBonus);
              await referrer.save();
            }
          }
        }
      } catch (error) {
        console.error("Error in admin_winner_decision:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      if (socket.userId && userSocketMap[socket.userId]) {
        userSocketMap[socket.userId] = userSocketMap[socket.userId].filter(id => id !== socket.id);
        if (userSocketMap[socket.userId].length === 0) delete userSocketMap[socket.userId];
      }

      await emitGamesList();
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
