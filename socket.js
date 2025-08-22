const { Server } = require("socket.io");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:3000" },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    socket.on("sendMessage", (data) => {
      console.log("Message received:", data);
      io.emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
