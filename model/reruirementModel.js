// models/Requirement.js
import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },

  // 🔗 Relations
  createdBy: {
    type: String, // Sales/Admin email
    required: true,
  },
  leadAssignedTo: {
    type: [String], // Lead email
    required: true,
  },
  leadAssignedBy: {
    type: String, // Sales who assigned to lead
  },
  recruiterAssignedTo: {
    type: [String], // Multiple recruiters (emails)
    default: [],
  },
  recruiterAssignedBy: {
    type: [String],
    default: [],
  },

  // 📍 Job Details
  locations: {
    type: [String],
    default: [],
  },
  employmentType: {
    type: String, // C2C, W2, Full-Time, etc.
  },
  workSetting: {
    type: String, // Onsite, Remote, Hybrid
  },
  rate: {
    type: String,
  },
  primarySkills: {
    type: String,
  },

  // 🔄 Status Tracking

  status: {
    type: String,
    enum: ["new", "leadAssigned", "recruiterAssigned", "inProgress", "closed"],
    default: "new",
  },
  requirementId: {
    type: String,
    unique: true,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Requirement", requirementSchema);
