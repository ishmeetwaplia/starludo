const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use("/api/auth", require("./src/routes/authRoute"));
app.use("/api/user", require("./src/routes/userRoute"));
app.use("/api/review", require("./src/routes/reviewRoute"));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
