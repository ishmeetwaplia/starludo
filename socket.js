const { Server } = require("socket.io");
const Game = require("./src/models/Game");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:3000" },
  });

  const userSocketMap = {};

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register_user", (userId) => {
      console.log("Registering user:", userId);
      userSocketMap[userId] = socket.id;
      socket.userId = userId;
    });

    try {
      setInterval(async () => {
        try {
          const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } }).populate("createdBy", "username credit");
          io.emit("games_list", updatedGames);
        } catch (error) {
          console.error("Error fetching games:", error);
        }
      }, 5000);
    } catch (error) {
      console.error("Error fetching games:", error);
    }

    socket.on("delete_game", async (gameId) => {
      try {
        await Game.findByIdAndDelete(gameId);
        const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } })
          .populate("createdBy", "username credit");
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
      } catch (error) {
        console.error("Error accepting game:", error);
      }
    })

    socket.on("disconnect", () => {
      if (socket.userId) {
        delete userSocketMap[socket.userId];
      }
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
