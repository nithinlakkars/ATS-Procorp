import { Router } from "express";
import {
  getLeads,
  getRecruiters,
  loginUser,
  registerUser,
} from "../controller/AuthController.js";
const router = Router();

// POST /api/login
router.post("/login", loginUser);
router.post("/register", registerUser);

router.get("/leads", getLeads);
router.get("/recruiters", getRecruiters);

export default router;
