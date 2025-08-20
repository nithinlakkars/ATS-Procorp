import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import router from "./routes/AuthRoutes.js";
import authenticateToken from "./middleware/authenticateToken.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import connect from "./config/db.js";
import testRoutes from "./routes/testRoutes.js";
import requirementRouter from "./routes/requirementRoutes.js";
import statsRoutes from "./routes/stats.routes.js";
import { testCreateDriveFolder } from "./controller/candidateController.js";
import driveAuthRoutes from "./routes/driveAuthRoutes.js";


// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// --- CORS configuration ---
let corsOptions;
if (process.env.NODE_ENV === "production") {
  corsOptions = {
    origin: process.env.FRONTEND_URL || "https://procorp-ats-frontend.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
} else {
  // Development: allow localhost
  corsOptions = {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
}

app.use(cors(corsOptions));

// --- Routes ---
app.use("/api/stats", statsRoutes);
app.use("/api", router);
app.use("/uploads", express.static("uploads"));
app.post("/api/candidates/test/create-drive-folder", testCreateDriveFolder);
app.use("/api/candidates", authenticateToken, candidateRoutes);
app.use("/api/test", testRoutes);
app.use("/api/requirements", requirementRouter);
app.use("/", driveAuthRoutes);


// --- Test route ---
app.get("/get", (req, res) => {
  return res.status(200).json({ message: "success", status: true });
});

// --- Database connection ---
connect();

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});
