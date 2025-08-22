const { Server } = require("socket.io");
const Game = require("./src/models/Game");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:3000" },
  });

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

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
      } catch (error) {
        console.error("Error deleting games:", error);
      }
    })

    socket.on("accept_game_request", async (gameId) => {
      try {
        console.log("Accepting game:", gameId);
        await Game.findByIdAndUpdate(gameId, { status: "requested" });
      } catch (error) {
        console.error("Error deleting games:", error);
      }
    })

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
