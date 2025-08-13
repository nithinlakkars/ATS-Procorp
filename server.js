import express from "express";
import router from "./routes/AuthRoutes.js";
import authenticateToken from "./middleware/authenticateToken.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import connect from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import testRoutes from "./routes/testRoutes.js";
import requirementRouter from "./routes/requirementRoutes.js"; // ✅ merged version
import { testCreateDriveFolder } from "./controller/candidateController.js";
import statsRoutes from "./routes/stats.routes.js";


dotenv.config();
const app = express();
app.use(express.json());

const corsOptions = {
  origin: "https://procorp-ats-frontend.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));


const PORT = process.env.PORT || 5000;

app.use("/api/stats", statsRoutes);
app.use("/api", router);
app.use("/uploads", express.static("uploads")); // resume static files
app.post("/api/candidates/test/create-drive-folder", testCreateDriveFolder);
app.use("/api/candidates", authenticateToken, candidateRoutes);
app.use("/api/test", testRoutes);
app.use("/api/requirements", requirementRouter); // ✅ only once

app.get("/get", (req, res) => {
  return res.status(200).json({ message: "success", status: true });
});

connect();
app.listen(PORT, () => {
  console.log("✅ Server is running on port", PORT);
});
