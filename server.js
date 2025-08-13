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

// Preflight support for all routes
app.options("*", cors(corsOptions));

// Logging incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// =====================
// Routes
// =====================
app.use("/api/stats", statsRoutes);
app.use("/api", router);
app.use("/uploads", express.static("uploads"));
app.post("/api/candidates/test/create-drive-folder", testCreateDriveFolder);
app.use("/api/candidates", authenticateToken, candidateRoutes);
app.use("/api/test", testRoutes);
app.use("/api/requirements", requirementRouter);

// Test endpoint
app.get("/get", (req, res) => res.status(200).json({ message: "success", status: true }));

// =====================
// 404 Handler
// =====================
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// =====================
// Error Handling Middleware
// =====================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// =====================
// Start Server
// =====================
connect();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("✅ Server is running on port", PORT);
});
