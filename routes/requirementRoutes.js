// routes/requirementRoutes.js
import express from "express";
import {
  submitRequirement,
  viewSalesRequirements,
  unassignedRequirements,
  assignRequirement,
  assignMultipleRequirements,
  viewAllRequirements,
  viewUnassignedLeads,
  recruiterViewRequirements,
  updateRequirementStatus,
  getAllLeadRequirements,
} from "../controller/requirementController.js";

import authorizeRole from "../middleware/authorizeRole.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import authenticateToken from "../middleware/authenticateToken.js";

const requirementRouter = express.Router();

// ------------------- SALES -------------------
requirementRouter.post(
  "/sales/submit",
  authMiddleware(["sales", "lead", "admin"]),
  submitRequirement
);

requirementRouter.get(
  "/sales/view",
  authenticateToken,
  authorizeRole(["admin", "sales"]),
  viewSalesRequirements
);

// ------------------- REQUIREMENT STATUS -------------------
requirementRouter.put(
  "/update-status",
  authenticateToken,
  authorizeRole(["admin"]),
  updateRequirementStatus
);

// ------------------- LEADS -------------------
requirementRouter.get(
  "/leads/unassigned",
  authenticateToken,
  authorizeRole(["lead"]),
  unassignedRequirements
);

requirementRouter.put(
  "/leads/assign-multiple",
  authenticateToken,
  authorizeRole(["lead"]),
  assignMultipleRequirements
);


requirementRouter.put(
  "/leads/assign/:reqId",
  authenticateToken,
  authorizeRole(["lead"]),
  assignRequirement
);

requirementRouter.get(
  "/leads/view-all",
  authenticateToken,
  authorizeRole(["admin"]),
  viewAllRequirements
);

requirementRouter.get(
  "/leads/view",
  authenticateToken,
  authorizeRole(["lead"]),
  viewUnassignedLeads
);


requirementRouter.get(
  "/leads/all",
  authMiddleware(["lead"]),
  getAllLeadRequirements
);


// ------------------- RECRUITER -------------------
requirementRouter.get(
  "/recruiter/view",
  authenticateToken,
  authorizeRole(["recruiter"]),
  recruiterViewRequirements
);

export default requirementRouter;
