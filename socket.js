const { Server } = require("socket.io");
const Game = require("./src/models/Game");
const Payment = require("./src/models/Payment");
const User = require("./src/models/User");

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

          if (inactiveTime > 2 * 60 * 1000) {

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
