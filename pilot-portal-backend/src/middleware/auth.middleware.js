const jwt = require("jsonwebtoken");
const { ensureJwtSecret } = require("../config/jwt");
const TokenService = require("../services/token.service");
const User = require("../models/user.model");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const jwtSecret = ensureJwtSecret();

  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    console.log("[Auth] Token decoded - userId:", decoded.userId, " Email:", decoded.email, " Role from token:", decoded.role);
    
    // Fetch user from database to get the role
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.error("[Auth] User not found for userId:", decoded.userId);
      return res.status(401).json({ message: "User not found" });
    }

    console.log("[Auth] User found in DB - Role in DB:", user.role);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: user.role || 'pilot', // Default to pilot if not set
      scopes: decoded.scopes || [], // For delegated access tokens
      jti: decoded.jti, // For audit logging
      appName: decoded.appName, // For audit logging
    };
    
    console.log("[Auth] Setting req.user:", JSON.stringify(req.user));
    next();
  } catch (err) {
    console.error("[Auth] Token verification failed:", err.message);
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};

