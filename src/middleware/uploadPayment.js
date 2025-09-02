const multer = require("multer");
const path = require("path");
const fs = require("fs");

const rootUploadPath = "/www/indianludoking.com/starludo/uploads/payments";

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

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"), false);
  }
};

const uploadPayment = multer({ storage, fileFilter });

module.exports = uploadPayment;
