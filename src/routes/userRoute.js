const express = require("express");
const controller = require("../controllers/userController");
const { responseHandler } = require("../middleware/responseHandler");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

router.get("/profile", verifyToken, responseHandler(controller.profileController));
router.put("/profile", verifyToken, responseHandler(controller.updateProfileController));
router.get("/logout", verifyToken, responseHandler(controller.logoutController));

module.exports = router;
