const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.admin = await User.findById(decoded.id).select("_id email role");
      if (!req.admin || req.admin.role !== "admin") {
        return res.status(401).json({ success: false, message: "Not authorized" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ 
        status: 401,
        success: false,
        message: "Token failed"
      });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
};
