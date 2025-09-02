const multer = require("multer");
const path = require("path");
const fs = require("fs");

const rootUploadPath = "/www/indianludoking.com/starludo/uploads/winnings";

if (!fs.existsSync(rootUploadPath)) {
  fs.mkdirSync(rootUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, rootUploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const uploadWinning = multer({ storage });

module.exports = uploadWinning;
