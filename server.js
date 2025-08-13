import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/AuthRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import authenticateToken from "./middleware/authenticateToken.js";
import testRoutes from "./routes/testRoutes.js";
import requirementRouter from "./routes/requirementRoutes.js";
import statsRoutes from "./routes/stats.routes.js";
import { testCreateDriveFolder } from "./controller/candidateController.js";
import connect from "./config/db.js";

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
    "https://procorp-ats-frontend.onrender.com", // production frontend
    "http://localhost:3000", // local testing
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
  console.log("Headers:", req.headers);
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
// Routes with debug
// =====================
app.use("/api/stats", debugRouter("StatsRouter"), statsRoutes);
app.use("/api", debugRouter("AuthRouter"), router);
app.use("/uploads", express.static("uploads"));
app.post("/api/candidates/test/create-drive-folder", debugRouter("TestDriveFolder"), testCreateDriveFolder);
app.use("/api/candidates", debugRouter("CandidatesRouter"), authenticateToken, candidateRoutes);
app.use("/api/test", debugRouter("TestRouter"), testRoutes);
app.use("/api/requirements", debugRouter("RequirementRouter"), requirementRouter);

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
  });
} catch (err) {
  console.error("🔥 Server failed to start:", err);
}
