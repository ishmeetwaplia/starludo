const express = require("express");
require("./logger");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const cors = require("cors");
const http = require("http");
const initSocket = require("./socket");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "https://sta-ludo-mgvh.vercel.app",
    "https://stat-ludo-admin.vercel.app",
    "https://indianludoking.com"
];

app.use(express.json());
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(express.json({
  verify: (req, res, buf) => {
    console.log("Raw request body:", buf.toString());
  }
}));

app.use("/api/auth", require("./src/routes/authRoute"));
app.use("/api/user", require("./src/routes/userRoute"));
app.use("/api/review", require("./src/routes/reviewRoute"));
app.use("/api/game", require("./src/routes/gameRoute"));
app.use("/api/admin", require("./src/routes/adminRoute"));
app.use("/uploads", express.static("uploads"));
app.use("/api/assets", require("./src/routes/assetRoute"));
app.use("/api/payment", require("./src/routes/paymentRoute"));

const server = http.createServer(app);
const io = initSocket(server);

global.io = io;

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
