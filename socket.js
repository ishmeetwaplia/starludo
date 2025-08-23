const { Server } = require("socket.io");
const Game = require("./src/models/Game");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:3000" },
  });

  const userSocketMap = {};

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register_user", async (userId) => {
      console.log("Registering user:", userId);
      userSocketMap[userId] = socket.id;
      socket.userId = userId;
      const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
      io.emit("games_list", updatedGames);
    });

    const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
    io.emit("games_list", updatedGames);

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


    socket.on("disconnect", async () => {
      if (socket.userId) {
        delete userSocketMap[socket.userId];
      }
      const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
      if (updatedGames.length > 0) {
        io.emit("games_list", updatedGames);
      }
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
