import { Router } from "express";
import authenticateToken from "../middleware/authenticateToken.js";
import authorizeRole from "../middleware/authorizeRole.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  assignMultipleRequirements,
  assignRequirement,
  authenticatedLeadRequirements,
  myLeadRequirements,
  recruiterViewRequirements,
  submitRequirement,
  unassignedRequirements,
  viewAllRequirements,
  viewSalesRequirements,
  viewUnassignedLeads,
} from "../controller/requirementController.js";

const routerRequirement = Router();

// 🎯 Sales submits a requirement
routerRequirement.post(
  "/sales/submit",
  authenticateToken,
  authorizeRole(["sales", "lead", "admin"]),
  submitRequirement
);

// 📋 View sales-posted requirements (admin only)
routerRequirement.get(
  "/sales/view",
  authenticateToken,
  authorizeRole(["admin"]),
  viewSalesRequirements
);

// 🚫 View unassigned requirements (for a lead)
routerRequirement.get(
  "/leads/unassigned",
  authenticateToken,
  authorizeRole(["lead"]),
  unassignedRequirements
);

// 👤 View my assigned requirements (lead)
routerRequirement.get(
  "/leads/my",
  authenticateToken,
  authorizeRole(["lead"]),
  myLeadRequirements
);

// 🔗 Assign one requirement to recruiters (lead)
routerRequirement.put(
  "/leads/assign/:reqId",
  authenticateToken,
  authorizeRole(["lead"]),
  assignRequirement
);

// 🔗 Assign multiple requirements (lead)
routerRequirement.put(
  "/leads/assign-multiple",
  authenticateToken,
  authorizeRole(["lead"]),
  assignMultipleRequirements
);

// 🌍 Admin views all requirements
routerRequirement.get(
  "/leads/view-all",
  authenticateToken,
  authorizeRole(["admin"]),
  viewAllRequirements
);

// 📭 Leads view requirements they haven’t assigned recruiters to
routerRequirement.get(
  "/leads/view",
  authenticateToken,
  authorizeRole(["lead"]),
  viewUnassignedLeads
);

// 👀 Recruiter views assigned requirements
routerRequirement.get(
  "/recruiter/view",
  authenticateToken,
  authorizeRole(["recruiter"]),
  recruiterViewRequirements
);

// 🔒 Authenticated lead requirement view (middleware-based)
routerRequirement.get(
  "/leads/view-auth",
  authMiddleware,
  authenticatedLeadRequirements
);

export default routerRequirement;
