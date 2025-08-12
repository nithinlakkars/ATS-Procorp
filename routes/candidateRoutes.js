import express, { Router } from "express";
import upload from "../middleware/upload.js";
import authorizeRole from "../middleware/authorizeRole.js";
import {
  forwardCandidateToSales,
  getLeadsCandidates,
  getRecruiterCandidates,
  getSalesCandidates,
  submitCandidate,
  uploadCandidateWithResume,
  updateCandidateFields, // ✅ unified update
  testCreateDriveFolder,
} from "../controller/candidateController.js";

const candidateRoutes = Router();


// ------------------- RECRUITER -------------------
candidateRoutes.post(
  "/recruiter/submit",
  authorizeRole(["recruiter"]),
  submitCandidate
);

candidateRoutes.post(
  "/recruiter/upload",
  authorizeRole(["recruiter"]),
  upload.array("resume", 5),
  uploadCandidateWithResume
);

candidateRoutes.get(
  "/recruiter/my-candidates/:userEmail",
  authorizeRole(["recruiter"]),
  getRecruiterCandidates
);

candidateRoutes.put(
  "/recruiter/update-fields",
  authorizeRole(["recruiter", "lead", "admin"]),
  updateCandidateFields // This is your controller function
);
// ------------------- TEST -------------------



// ------------------- LEADS -------------------
candidateRoutes.get("/leads", authorizeRole(["lead", "admin", "sales"]), getLeadsCandidates);

candidateRoutes.post(
  "/leads/forward/:id",
  authorizeRole(["lead"]),
  forwardCandidateToSales
);

// ------------------- SALES -------------------
candidateRoutes.get("/sales", authorizeRole(["admin", "sales", "accountManager"]), getSalesCandidates);


export default candidateRoutes;
