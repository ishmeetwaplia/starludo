const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const cors = require("cors");
const http = require("http");
const initSocket = require("./socket");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api/auth", require("./src/routes/authRoute"));
app.use("/api/user", require("./src/routes/userRoute"));
app.use("/api/review", require("./src/routes/reviewRoute"));
app.use("/api/game", require("./src/routes/gameRoute"));
app.use("/api/admin", require("./src/routes/adminRoute"));
app.use("/uploads", express.static("uploads"));
app.use("/api/assets", require("./src/routes/assetRoute"));


const server = http.createServer(app);
const io = initSocket(server);

global.io = io; 

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
