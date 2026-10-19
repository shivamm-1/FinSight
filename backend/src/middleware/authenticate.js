const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user.js");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Authentication is not configured",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof decoded.sub !== "string" ||
      !mongoose.isValidObjectId(decoded.sub)
    ) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    const user = await User.findById(decoded.sub).select(
      "_id username email role isActive",
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "User account is unavailable",
      });
    }

    // Attach the authenticated user to the request.
    // Both _id and id are provided for compatibility.
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Authentication token has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      message: "Unable to authenticate the request",
    });
  }
}

module.exports = authenticate;
