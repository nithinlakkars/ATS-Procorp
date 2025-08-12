import jwt from "jsonwebtoken";
import User from "../model/user.js";

// 🔐 Auth middleware with optional role restriction
export const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized - No token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "yoursecret");

      // 👇 Use email instead of userId
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        return res.status(401).json({ error: "Unauthorized - User not found" });
      }

      // 🔐 Check role (case-insensitive)
      if (
        roles.length &&
        !roles.map((r) => r.toLowerCase()).includes(user.role.toLowerCase())
      ) {
        return res.status(403).json({ error: "Forbidden - Access denied" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};

// 🔐 Optional role-only guard
export const restrictTo = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied - Insufficient role" });
    }
    next();
  };
};
