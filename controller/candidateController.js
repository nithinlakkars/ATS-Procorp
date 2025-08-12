// Top of your controller file
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { createCandidateFolder, uploadToDrive } from "../utils/uploadToDriveOAuth.js";

import Candidate from "../model/Candidate.js";
import Requirement from "../model/Requirement.js";
import { sendEmail } from "../utils/emailSender.js";
import { createFolderInDrive } from "../services/googleDriveService.js";
import { time } from "console";

const generateCandidateId = (name) => {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const safeName = name?.trim().toLowerCase().replace(/\s+/g, "") || "unknown";
  return `${safeName}_${timeStr}`;
};

export const submitCandidate = async (req, res) => {
  try {
    const {
      name,
      requirementId,
      email: recruiterEmail,
      isActive,
      ...rest
    } = req.body;

    if (!name || !requirementId) {
      return res.status(400).json({ error: "❌ Name and Requirement ID are required" });
    }

    const candidateId = generateCandidateId(name);

    const candidate = new Candidate({
      name,
      requirementId,
      candidateId,
      sourceRole: "recruiter",
      status: "submitted",
      isActive: isActive ?? false,
      addedBy: req.user.email,
      ...rest,
    });

    await candidate.save();

    const requirement = await Requirement.findOne({ requirementId });
    if (requirement?.leadAssignedTo?.length) {
      await Promise.all(
        requirement.leadAssignedTo.map((leadEmail) =>
          sendEmail({
            to: leadEmail,
            subject: `📥 New Candidate Submitted for ${requirementId}`,
            html: `<p>New candidate <strong>${name}</strong> was submitted under your requirement <strong>${requirementId}</strong>.</p>`,
          })
        )
      );
    }

    res.status(201).json({ message: "✅ Candidate submitted", candidate });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "❌ Failed to submit candidate" });
  }
};

export const uploadCandidateWithResume = async (req, res) => {
  try {
    console.log("🔒 Role Check — required: [ 'recruiter' ]  | user has:", req.user?.role);
    console.log("📥 Request body:", req.body);

    const {
      name,
      email,
      phone,
      source,
      requirementId,
      currentLocation,
      rate,
      relocation,
      passportNumber,
      last4SSN,
      visaStatus,
      linkedinUrl,
      clientDetails,
      role,
      isActive,
      salesStatus,
      workAuthorization,
      forwardToLeads,
    } = req.body;

    const resumeFiles = req.files;
    if (!resumeFiles || resumeFiles.length === 0) {
      return res.status(400).json({ error: "At least one resume file is required." });
    }

    // ✅ Generate unique candidate ID
    // ⏰ Get time-only string in HHMMSSms format (e.g., 1445122)
    const now = new Date();
    const timeOnly = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}${Math.floor(now.getMilliseconds() / 10)}`;

    // 🧼 Clean name for ID
    const sanitizedName = name.trim().replace(/[^\w\-]/g, "");

    // 🆔 Combine to form Candidate ID
    const candidateId = `${sanitizedName}_${timeOnly}`;

    // 📁 Folder name = email (cleaned)
    const folderName = email.trim().replace(/[@.]/g, "_").replace(/[^\w\-]/g, "_");

    const folderId = await createCandidateFolder(folderName);
    const folderLink = `https://drive.google.com/drive/folders/${folderId}`;
    console.log("📁 Folder created:", folderLink);

    // ✅ Upload resume files to Drive folder
    await Promise.all(
      resumeFiles.map(file =>
        uploadToDrive(file.originalname, file.buffer, file.mimetype, folderId)
      )
    );

    // ✅ Normalize requirementId to array
    const requirementIds = Array.isArray(requirementId) ? requirementId : [requirementId];

    // ✅ Create and save candidate
    const newCandidate = new Candidate({
      candidateId,
      name,
      email,
      phone,
      source,
      requirementId: requirementIds,
      currentLocation,
      rate,
      relocation,
      passportnumber: passportNumber,
      Last4digitsofSSN: last4SSN,
      VisaStatus: visaStatus,
      LinkedinUrl: linkedinUrl,
      clientdetails: clientDetails,
      role,
      resumeUrls: [folderLink],
      folderId,
      addedBy: req.user?.email,
      sourceRole: req.user?.role || "recruiter",
      isActive: isActive === "true" || isActive === true,
      workAuthorization: Array.isArray(workAuthorization)
        ? workAuthorization
        : typeof workAuthorization === "string"
          ? [workAuthorization]
          : [],
      candidate_update: "submitted",
      status: "submitted",
    });
   console.log("🚨 candidate_update value before saving:", newCandidate.candidate_update);
    await newCandidate.save();
    console.log("✅ Candidate saved to database");

    // ✅ Optional: notify leads
    if (Array.isArray(forwardToLeads) && forwardToLeads.length > 0) {
      await sendEmail({
        to: forwardToLeads,
        subject: "New Candidate Submitted",
        text: `A new candidate ${name} has been submitted for role ${role}.`,
      });
    }

    res.status(201).json({
      message: "Candidate uploaded and saved successfully",
      candidateId,
      folderLink,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      error: "Failed to upload candidate resume",
      details: error.message,
    });
  }
};






// ✅ Get candidates for lead
export const getLeadsCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({
      $and: [
        { status: { $in: ["submitted", "forwarded-to-sales", "new"] } },
        {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } },
          ],
        },
      ],
    });

    // Collect all unique requirementIds
    const reqIds = new Set();
    candidates.forEach(c => {
      const ids = Array.isArray(c.requirementId) ? c.requirementId : [c.requirementId];
      ids.forEach(id => reqIds.add(id));
    });

    // Fetch matching requirements
    const requirements = await Requirement.find({
      requirementId: { $in: Array.from(reqIds) },
    });

    // Map requirementId to title
    const reqMap = {};
    requirements.forEach(r => {
      reqMap[r.requirementId] = r.title || r.requirementId;
    });

    // Enrich candidates with requirement titles
    const enrichedCandidates = candidates.map(c => {
      const ids = Array.isArray(c.requirementId) ? c.requirementId : [c.requirementId];
      const titles = ids.map(id => reqMap[id] || id);
      return { ...c.toObject(), requirementTitles: titles };
    });

    res.status(200).json({
      message: "✅ Fetched candidates",
      candidates: enrichedCandidates,
      status: true,
    });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "❌ Failed to fetch leads candidates" });
  }
};



// ✅ Forward candidate to sales
export const forwardCandidateToSales = async (req, res) => {
  try {
    const { forwardedBy } = req.body;

    const email =
      typeof forwardedBy === "object"
        ? forwardedBy.email
        : (JSON.parse(forwardedBy)?.email || forwardedBy);

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        status: "forwarded-to-sales",
        sourceRole: "leads",
        forwardedBy: email || "unknown",
      },
      { new: true }
    );

    res.json({ message: "✅ Forwarded to sales", candidate });
  } catch (err) {
    console.error("❌ Forwarding error:", err);
    res.status(500).json({ error: "❌ Failed to forward candidate" });
  }
};



// ✅ Get sales candidates
export const getSalesCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({ status: "forwarded-to-sales" })
      .select("+isActive");

    // Extract unique requirement IDs from candidates
    const reqIdSet = new Set();
    candidates.forEach(c => {
      const ids = Array.isArray(c.requirementId) ? c.requirementId : [c.requirementId];
      ids.forEach(id => reqIdSet.add(id));
    });

    // Find matching Requirements
    const requirements = await Requirement.find({
      requirementId: { $in: Array.from(reqIdSet) },
    });

    // Create a mapping of requirementId -> title
    const reqMap = {};
    requirements.forEach(req => {
      reqMap[req.requirementId] = req.title || req.requirementId;
    });

    // Attach requirement titles to each candidate
    const enrichedCandidates = candidates.map(candidate => {
      const ids = Array.isArray(candidate.requirementId) ? candidate.requirementId : [candidate.requirementId];
      const titles = ids.map(id => reqMap[id] || id);
      return {
        ...candidate.toObject(),
        requirementTitles: titles,
      };
    });

    res.status(200).json({
      message: "✅ Sales candidates fetched",
      candidates: enrichedCandidates,
      status: true,
    });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "❌ Failed to fetch sales candidates" });
  }
};



// ✅ Get recruiter candidates
export const getRecruiterCandidates = async (req, res) => {
  try {
    const { userEmail } = req.params;

    // 1. Fetch candidates added by the recruiter
    const candidates = await Candidate.find({
      addedBy: userEmail,
      $or: [{ sourceRole: "recruiter" }, { sourceRole: "leads" }],
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

    // 2. Collect all unique requirementIds across all candidates
    const allReqIds = new Set();
    candidates.forEach(c => {
      const ids = Array.isArray(c.requirementId) ? c.requirementId : [c.requirementId];
      ids.forEach(id => allReqIds.add(id));
    });

    // 3. Fetch matching Requirement records
    const requirements = await Requirement.find({
      requirementId: { $in: Array.from(allReqIds) },
    });

    // 4. Map requirementId to requirement details
    const requirementMap = {};
    requirements.forEach(req => {
      requirementMap[req.requirementId] = req.title || req.requirementId;
    });

    // 5. Attach requirement titles to each candidate for frontend rendering
    const enrichedCandidates = candidates.map(c => {
      const ids = Array.isArray(c.requirementId) ? c.requirementId : [c.requirementId];
      const titles = ids.map(id => requirementMap[id] || id);
      return { ...c.toObject(), requirementTitles: titles };
    });

    res.status(200).json({
      message: "✅ Recruiter candidates fetched",
      candidates: enrichedCandidates,
      status: true,
    });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "❌ Failed to fetch recruiter candidates" });
  }
};

// ✅ Update candidate's isActive status
// Optional: Unified update controller
export const updateCandidateFields = async (req, res) => {
  try {
    const { candidateId, isActive, candidate_update } = req.body;

    // ✅ Step 1: Validate input
    if (!candidateId) {
      return res.status(400).json({ error: "❌ candidateId is required" });
    }

    const updateFields = {};

    // ✅ Step 2: Add updatable fields conditionally
    if (typeof isActive === "boolean") {
      updateFields.isActive = isActive;
    }

    if (typeof candidate_update === "string" && candidate_update.trim() !== "") {
      updateFields.candidate_update = candidate_update;
    }

    // ⚠️ Optional: Return error if no fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "❌ No valid fields to update" });
    }

    // ✅ Step 3: Perform the update
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      updateFields,
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ error: "❌ Candidate not found" });
    }

    // ✅ Step 4: Respond with updated candidate
    return res.status(200).json({
      message: "✅ Candidate fields updated successfully",
      candidate: updatedCandidate,
    });
  } catch (err) {
    console.error("❌ Update error:", err);
    return res.status(500).json({ error: "❌ Failed to update candidate fields" });
  }
};

// Route: POST /api/test/create-drive-folder
export const testCreateDriveFolder = async (req, res) => {
  try {
    const candidateId = req.body.candidateId || "testCandidate_" + Date.now();
    console.log("📁 Creating folder for:", candidateId);

    const folderId = await createFolderInDrive(candidateId);

    if (!folderId) throw new Error("No folder ID returned");

    res.status(200).json({ success: true, folderId });
  } catch (error) {
    console.error("❌ Folder creation failed:", error.message, error.stack);
    res.status(500).json({ error: "Folder creation failed" });
  }
};


