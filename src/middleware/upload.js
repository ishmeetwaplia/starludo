const multer = require("multer");
const path = require("path");
const fs = require("fs");

const rootUploadPath = path.join(__dirname, "..", "..", "uploads");

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others"; 

    if (file.fieldname === "scanner") folder = "scanners";
    else if (file.fieldname === "banners") folder = "banner";
    else if (file.fieldname === "tournaments") folder = "tournaments";

    const uploadPath = path.join(rootUploadPath, folder);
    ensureDirSync(uploadPath);

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage });

module.exports = upload;
