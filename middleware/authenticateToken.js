import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized - Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "yoursecret");
    req.user = decoded; // 👈 This is critical!
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};


export default authenticateToken;
