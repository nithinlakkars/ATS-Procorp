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
  upload.array("resume", 10), // keeps your array upload
  async (req, res, next) => {
    try {
      console.log("Request body:", req.body);
      console.log("Files received:", req.files);

      if (!req.files || req.files.length === 0) {
        throw new Error("No resume files uploaded");
      }

      const { name, email } = req.body;
      if (!name || !email) {
        throw new Error("Name or email missing");
      }

      // Call your existing controller function
      await uploadCandidateWithResume(req, res, next);
    } catch (err) {
      next(err); // sends error to global error handler in server.js
    }
  }
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
