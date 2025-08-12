// routes/requirementRoutes.js
import express from "express";
import {
  submitRequirement,
  viewSalesRequirements,
  unassignedRequirements,
  myLeadRequirements,
  assignRequirement,
  assignMultipleRequirements,
  viewAllRequirements,
  viewUnassignedLeads,
  recruiterViewRequirements,
  authenticatedLeadRequirements,
  updateRequirementStatus, // ✅ new
} from "../controller/requirementController.js";

import authorizeRole from "../middleware/authorizeRole.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import authenticateToken from "../middleware/authenticateToken.js";

const requirementRouter = express.Router();

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


// ✅ New route for updating status
requirementRouter.put(
  "/update-status",
  authenticateToken,
  authorizeRole("admin"),
  updateRequirementStatus
);

// Other routes...
requirementRouter.get(
  "/leads/unassigned",
  authenticateToken,
  authorizeRole("lead"),
  unassignedRequirements
);

requirementRouter.put(
  "/leads/assign-multiple",
  authenticateToken,
  authorizeRole("lead"),
  assignMultipleRequirements
);

requirementRouter.get(
  "/leads/my",
  authenticateToken,
  authorizeRole("lead"),
  myLeadRequirements
);

requirementRouter.put(
  "/leads/assign/:reqId",
  authenticateToken,
  authorizeRole("lead"),
  assignRequirement
);

requirementRouter.get(
  "/leads/view-all",
  authenticateToken,
  authorizeRole("admin"),
  viewAllRequirements
);

requirementRouter.get(
  "/leads/view",
  authenticateToken,
  authorizeRole("lead"),
  viewUnassignedLeads
);

requirementRouter.get(
  "/recruiter/view",
  authenticateToken,
  authorizeRole("recruiter"),
  recruiterViewRequirements
);

requirementRouter.get(
  "/leads/view-auth",
  authMiddleware,
  authorizeRole("lead"),
  authenticatedLeadRequirements
);
requirementRouter.get(
  "/sales/view",
  authenticateToken,
  authorizeRole(["admin", "sales"]),
  viewSalesRequirements
);

export default requirementRouter;
