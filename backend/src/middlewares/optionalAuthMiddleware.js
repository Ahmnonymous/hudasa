const jwt = require("jsonwebtoken");

/**
 * Optional authentication middleware
 * Similar to authMiddleware, but doesn't fail if no token is provided
 * Still validates and attaches user info if token is present
 */
module.exports = function (req, res, next) {
  try {
    const authHeader = req.header("Authorization");

    // No token provided - continue without authentication
    if (!authHeader) {
      return next();
    }

    // ✅ Support both "Bearer <token>" and raw "<token>"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // Empty token - continue without authentication
    if (!token) {
      return next();
    }

    // Try to verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Attach decoded user data to request (e.g., id, username, userType)
      req.user = decoded;
    } catch (err) {
      console.log("⚠️ Token provided but invalid, proceeding without auth:", err.message);
      // Continue without authentication if token is invalid
    }

    return next();
  } catch (err) {
    console.error("❌ Optional auth error:", err.message);
    // Continue without authentication even on error
    return next();
  }
};

