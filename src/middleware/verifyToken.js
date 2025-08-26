const jwt = require("jsonwebtoken");
const { statusCode, resMessage } = require("../config/constant");
const User = require("../models/User");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(statusCode.UNAUTHORIZED).json({
        status: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.Token_missing
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(statusCode.UNAUTHORIZED).json({
        status: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.User_not_found,
      });
    }

    if (!user.token) {
      return res.status(statusCode.UNAUTHORIZED).json({
        status: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.Token_invalid,
      });
    }

    if (user.role !== "user") {
      return res.status(statusCode.UNAUTHORIZED).json({
        status: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.Not_authorized,
      });
    }

    req.auth = user;
    next();
  } catch (error) {
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
