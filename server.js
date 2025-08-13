import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// import router from "./routes/AuthRoutes.js";
// import candidateRoutes from "./routes/candidateRoutes.js";
// import authenticateToken from "./middleware/authenticateToken.js";
// import testRoutes from "./routes/testRoutes.js";
// import requirementRouter from "./routes/requirementRoutes.js";
// import statsRoutes from "./routes/stats.routes.js";
// import { testCreateDriveFolder } from "./controller/candidateController.js";
// import connect from "./config/db.js";

dotenv.config();
const app = express();

// =====================
// Debug wrapper for app.use
// =====================
const originalUse = app.use.bind(app);
app.use = (...args) => {
  if (args[0] && typeof args[0] === "string") {
    // Log the path used
    console.log("🔍 app.use called with path:", args[0]);
    if (args[0].startsWith("http://") || args[0].startsWith("https://")) {
      console.error("❌ WARNING: Full URL used in app.use! This will break path-to-regexp:", args[0]);
    }
  }
  return originalUse(...args);
};

// =====================
// Middleware
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
function debugRouter(routerName) {
  return (req, res, next) => {
    console.log(`➡️ Router hit: ${routerName} | ${req.method} ${req.originalUrl}`);
    next();
  };
}

// =====================
// API Base Path from ENV
// =====================
const API_BASE = process.env.API_BASE || "/api";

// =====================
// Routes
// =====================
// app.use(`${API_BASE}/stats`, debugRouter("StatsRouter"), statsRoutes);
// app.use(`${API_BASE}`, debugRouter("AuthRouter"), router);
// app.use("/uploads", express.static("uploads"));
// app.post(`${API_BASE}/candidates/test/create-drive-folder`, debugRouter("TestDriveFolder"), testCreateDriveFolder);
// app.use(`${API_BASE}/candidates`, debugRouter("CandidatesRouter"), authenticateToken, candidateRoutes);
// app.use(`${API_BASE}/test`, debugRouter("TestRouter"), testRoutes);
// app.use(`${API_BASE}/requirements`, debugRouter("RequirementRouter"), requirementRouter);

// Test endpoint
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
// Print all registered routes
// =====================
console.log("📌 Registered routes:");
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(middleware.route);
  } else if (middleware.name === "router") {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(handler.route);
      }
    });
  }
});

// =====================
// Start Server
// =====================
try {
  connect();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log("✅ Server is running on port", PORT);
    console.log(`🌐 API Base Path: ${API_BASE}`);
  });
} catch (err) {
  console.error("🔥 Server failed to start:", err);
}
