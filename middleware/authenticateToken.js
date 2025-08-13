import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  console.log("🔹 Auth middleware triggered for:", req.method, req.originalUrl);
  console.log("🔹 Headers:", req.headers);

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ No token found in Authorization header");
    return res.status(401).json({ error: "Unauthorized - Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "yoursecret");
    console.log("✅ Token verified. User:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

export default authenticateToken;
