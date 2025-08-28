const { Server } = require("socket.io");
const Game = require("./src/models/Game");
const Payment = require("./src/models/Payment");
const User = require("./src/models/User");
const Withdraw = require("./src/models/Withdraw")

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:3000" },
  });

  const userSocketMap = {};

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    setInterval(async () => {
      try {
        const games = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");

        let hasExpired = false;

        for (const game of games) {
          const gameAge = Date.now() - new Date(game.createdAt).getTime();

          if (gameAge > 5 * 60 * 1000) {
            game.status = "expired";
            await game.save();
            hasExpired = true;
          }
        }

        if (hasExpired) {
          const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");

          io.emit("games_list", updatedGames);
        }

      } catch (error) {
        console.error("Error in game expiration loop:", error);
      }
    }, 1000);

    const updatedGames = await Game.find({ status: "started" }).populate("createdBy", "username credit").populate("acceptedBy", "username credit");
    io.emit("live_games", updatedGames);

    setInterval(async () => {
      try {
        const games = await Game.find({ status: "started" }).populate("createdBy", "username credit");

        let hasExpired = false;

        for (const game of games) {
          const gameAge = Date.now() - new Date(game.createdAt).getTime();

          if (gameAge > 15 * 60 * 1000) {
            game.status = "completed";
            await game.save();
            hasExpired = true;
          }
        }

        if (hasExpired) {
          const updatedGames = await Game.find({ status: "started" }).populate("createdBy", "username credit").populate("acceptedBy", "username credit");
          io.emit("live_games", updatedGames);
        }

      } catch (error) {
        console.error("Error in live game expiration loop:", error);
      }
    }, 1000);

    setInterval(async () => {
      try {

        const games = await Game.find({ status: "started" })
          .populate("createdBy", "username credit")
          .populate("acceptedBy", "username credit");


        for (const game of games) {
          const inactiveTime = Date.now() - new Date(game.updatedAt).getTime();

          if (inactiveTime > 20 * 60 * 1000) {

            game.status = "cancelled";
            await game.save();

            const creatorId = game.createdBy?._id?.toString();
            const accepterId = game.acceptedBy?._id?.toString();

            const creatorSocketId = creatorId ? userSocketMap[creatorId] : null;
            const accepterSocketId = accepterId ? userSocketMap[accepterId] : null;

            if (creatorSocketId) {
              io.to(creatorSocketId).emit("game_over", {
                gameId: game._id,
                status: game.status,
                message: "Game cancelled due to inactivity",
              });
            }

            if (accepterSocketId) {
              io.to(accepterSocketId).emit("game_over", {
                gameId: game._id,
                status: game.status,
                message: "Game cancelled due to inactivity",
              });
            }
          }
        }
      } catch (error) {
        console.error("❌ Error in inactive game cancel loop:", error);
      }
    }, 1000);

    socket.on("register_user", async (userId) => {
      console.log("Registering user:", userId);
      userSocketMap[userId] = socket.id;
      socket.userId = userId;
      const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
      io.emit("games_list", updatedGames);
    });

    socket.on("delete_game", async (gameId) => {
      try {
        await Game.findByIdAndDelete(gameId);
        const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
        io.emit("games_list", updatedGames);
      } catch (error) {
        console.error("Error deleting game:", error);
      }
    });

    socket.on("accept_game_request", async ({ gameId, userId }) => {
      try {
        const game = await Game.findByIdAndUpdate(gameId, { status: "requested", acceptedBy: userId }, { new: true }).populate("createdBy", "username");

        if (!game) return;

        const creatorId = game.createdBy._id.toString();
        const creatorSocketId = userSocketMap[creatorId];

        if (creatorSocketId) {
          io.to(creatorSocketId).emit("game_accepted", {
            gameId,
            acceptedBy: userId
          });
        }

        const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
        io.emit("games_list", updatedGames);
      } catch (error) {
        console.error("Error accepting game:", error);
      }
    })

    socket.on("cancel_game_request", async (gameId) => {
      try {
        const game = await Game.findById(gameId).populate("acceptedBy", "_id username");

        if (!game || !game.acceptedBy) return;

        const accepterId = game.acceptedBy._id.toString();
        const accepterSocketId = userSocketMap[accepterId];

        if (accepterSocketId) {
          io.to(accepterSocketId).emit("game_request_canceled", {
            gameId,
            message: "The creator has canceled the game request.",
          });
        }

        await Game.findByIdAndUpdate(gameId, { status: "cancelled", acceptedBy: null });

        const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
        io.emit("games_list", updatedGames);

      } catch (error) {
        console.error("Error canceling game request:", error);
      }
    });

    socket.on("start_game", async (gameId) => {
      try {
        const game = await Game.findById(gameId)
          .populate("createdBy", "_id username credit ")
          .populate("acceptedBy", "_id username credit ");

        if (!game || !game.acceptedBy) return;

        const accepterId = game.acceptedBy._id.toString();
        const accepterSocketId = userSocketMap[accepterId];

        if (accepterSocketId) {
          io.to(accepterSocketId).emit("start_game", {
            gameId,
            roomId: game.roomId,
            message: "The creator has started the game.",
          });
        }

        const betAmount = game.betAmount;
        await Promise.all([
          User.findByIdAndUpdate(game.createdBy._id, {
            $inc: { credit: -betAmount }
          }),
          User.findByIdAndUpdate(game.acceptedBy._id, {
            $inc: { credit: -betAmount }
          })
        ]);

        await Game.findByIdAndUpdate(gameId, { status: "started" });

        const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
        io.emit("games_list", updatedGames);

        const liveGames = await Game.find({ status: "started" }).populate("createdBy", "username credit").populate("acceptedBy", "username credit");
        io.emit("live_games", liveGames);

      } catch (error) {
        console.error("Error starting game:", error);
      }
    });

    socket.on("update_payment_status", async ({ paymentId, status }) => {
      try {
        if (!["approved", "rejected", "pending"].includes(status)) return;

        const payment = await Payment.findById(paymentId).populate("userId", "username");
        if (!payment) return;

        payment.status = status;
        await payment.save();

        // 🔹 Notify the user who made the payment
        const userId = payment.userId._id.toString();
        const userSocketId = userSocketMap[userId];
        if (userSocketId) {
          io.to(userSocketId).emit("payment_update", {
            message: `Your payment has been ${status}`,
            payment,
          });
        }

      } catch (error) {
        console.error("Error approving payment:", error);
      }
    });

    socket.on("update_withdraw_status", async ({ withdrawId, status }) => {
      try {
        console.log("🔔 Received update_withdraw_status event:", { withdrawId, status });

        if (!["paid", "rejected"].includes(status)) {
          console.log("⚠️ Invalid status received, ignoring:", status);
          return;
        }

        const withdraw = await Withdraw.findById(withdrawId).populate("userId", "username winningAmount");
        if (!withdraw) {
          console.log("❌ Withdraw not found for ID:", withdrawId);
          return;
        }

        console.log("✅ Withdraw found:", {
          id: withdraw._id,
          statusBefore: withdraw.status,
          user: withdraw.userId?.username,
          amount: withdraw.amount,
        });

        withdraw.status = status;
        await withdraw.save();
        console.log("💾 Withdraw status updated to:", status);

        const user = await User.findById(withdraw.userId._id);
        if (user && status === "paid") {
          console.log("👤 User found:", { id: user._id, username: user.username, oldWinningAmount: user.winningAmount });

          const oldAmount = Number(user.winningAmount) || 0;
          const deductAmount = Number(withdraw.amount) || 0;
          const newAmount = oldAmount - deductAmount < 0 ? 0 : oldAmount - deductAmount;

          console.log("💲 Calculating winningAmount:", {
            oldAmount,
            deductAmount,
            newAmount,
          });

          user.winningAmount = String(newAmount);
          await user.save();
          console.log("💾 User winningAmount updated successfully:", user.winningAmount);
        } else {
          console.log("ℹ️ No user update needed (status:", status, ")");
        }

        // 🔹 (Optional) Notify user if needed
        // console.log("📡 Attempting to notify user about withdrawal status change...");
        // const userId = withdraw.userId._id.toString();
        // const userSocketId = userSocketMap[userId];
        // if (userSocketId) {
        //   console.log("📡 Emitting withdraw_update event to user socket:", userSocketId);
        //   io.to(userSocketId).emit("withdraw_update", {
        //     message: `Your withdrawal has been ${status}`,
        //     withdraw,
        //   });
        // } else {
        //   console.log("⚠️ User socket not found for userId:", userId);
        // }

      } catch (error) {
        console.error("❌ Error in update_withdraw_status:", error);
      }
    });
    
    socket.on("admin_winner_decision", async ({ gameId, winner }) => {
      try {

        const game = await Game.findById(gameId)
          .populate("createdBy", "_id username")
          .populate("acceptedBy", "_id username");

        if (!game) {
          return socket.emit("error_message", { message: "Game not found" });
        }

        if (game.adminstatus === "decided") {
          return socket.emit("error_message", { message: "Game has already been decided" });
        }

        if (
          String(game.createdBy._id) !== String(winner) &&
          String(game.acceptedBy._id) !== String(winner)
        ) {
          return socket.emit("error_message", { message: "Winner must be one of the players in this game" });
        }

        const loserId =
          String(game.createdBy._id) === String(winner)
            ? game.acceptedBy._id
            : game.createdBy._id;

        game.winner = winner;
        game.loser = loserId;
        game.adminstatus = "decided";
        game.status = "completed";
        await game.save();

        const user = await User.findById(winner);
        if (user) {
          const oldAmount = Number(user.winningAmount) || 0;
          const addAmount = Number(game.winningAmount) || 0;
          const newAmount = oldAmount + addAmount;

          user.winningAmount = String(newAmount);
          await user.save();
        } else {
          console.log("⚠️ Winner user not found in DB:", winner);
        }

      } catch (error) {
        console.error("❌ Error in admin_winner_decision:", error);
      }
    });

    socket.on("disconnect", async () => {
      if (socket.userId) {
        delete userSocketMap[socket.userId];
      }
      const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
      io.emit("games_list", updatedGames);

      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
