import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authenticateToken from "./middleware/authenticateToken.js";

// Import routers (keep commented if testing one by one)
// import router from "./routes/AuthRoutes.js";
// import candidateRoutes from "./routes/candidateRoutes.js";
// import requirementRouter from "./routes/requirementRoutes.js";
// import statsRoutes from "./routes/stats.routes.js";
// import { testCreateDriveFolder } from "./controller/candidateController.js";

dotenv.config();
const app = express();

// =====================
// Middleware
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form-data

// Allowed origins
const corsOptions = {
  origin: [
    "https://procorp-ats-frontend.onrender.com",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// =====================
// Request-level Debug Logger
// =====================
app.use((req, res, next) => {
  console.log(`🟢 Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// =====================
// Router Debug Wrapper
// =====================
function safeUse(path, ...routers) {
  try {
    app.use(path, ...routers);
    console.log(`✅ Router mounted at ${path}`);
  } catch (err) {
    console.error(`🔥 Failed to mount router at ${path}:`, err.message);
  }
}

// =====================
// Routes (wrap with safeUse)
// =====================
// Example: uncomment one at a time to locate the problematic router
// safeUse("/api", router);
// safeUse("/api/candidates", authenticateToken, candidateRoutes);
// safeUse("/api/requirements", requirementRouter);
// safeUse("/api/stats", statsRoutes);
// safeUse("/api/candidates/test/create-drive-folder", testCreateDriveFolder);

// =====================
// Test endpoint
// =====================
app.get("/get", (req, res) => res.status(200).json({ message: "success", status: true }));

// =====================
// 404 Handler
// =====================
app.use((req, res, next) => {
  console.warn(`⚠️ 404 Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// =====================
// Error Handling Middleware
// =====================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR Middleware triggered:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// =====================
// Start Server
// =====================
try {
  const connect = (await import("./config/db.js")).default;
  connect();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
} catch (err) {
  console.error("🔥 Server failed to start:", err);
}
