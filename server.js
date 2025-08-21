const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api/auth", require("./src/routes/authRoute"));
app.use("/api/user", require("./src/routes/userRoute"));
app.use("/api/review", require("./src/routes/reviewRoute"));
app.use("/api/game", require("./src/routes/gameRoute"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

global.io = io; 

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
