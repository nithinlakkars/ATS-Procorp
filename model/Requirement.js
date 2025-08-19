import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema({
  // 📌 Basic Details
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },

  // 🧾 Client Field
  client: {
    type: String,
    required: false,
    trim: true,
  },

  // 🔗 Relations
  createdBy: {
    type: String, // Sales/Admin email
    required: true,
    lowercase: true,
    trim: true,
  },
  leadAssignedTo: {
    type: [String], // Lead email(s)
    required: false,
    default: [],
    set: (emails) => emails.map((e) => e.toLowerCase().trim()),
  },
  leadAssignedBy: {
    type: String,
    lowercase: true,
    trim: true,
  },
  recruiterAssignedTo: {
    type: [String], // Recruiter emails
    default: [],
    set: (emails) => emails.map((e) => e.toLowerCase().trim()),
    index: true,
  },
  recruiterAssignedBy: {
    type: [String],
    default: [],
    set: (emails) => emails.map((e) => e.toLowerCase().trim()),
  },

  // 📍 Job Details
  locations: {
    type: [String],
    default: [],
  },
  employmentType: {
    type: String,
  },
  workSetting: {
    type: String,
  },
  rate: {
    type: String,
  },
  primarySkills: {
    type: String,
  },

  // ✅ Priority Field
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
  },

  // 🔄 Workflow Status Tracking
  status: {
    type: String,
    enum: ["new", "leadAssigned", "recruiterAssigned", "inProgress", "closed"],
    default: "new",
  },

  // 🆕 Separate Requirement Status (Open/Closed)
  requirementStatus: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },

  // 🆔 Custom ID
  requirementId: {
    type: String,
    unique: true,
    required: true,
  },

  workAuthorization: {
    type: [String],
    enum: ["USC", "GC","GC-EAD", "H1B","H4-EAD","TN","L2-EAD","OPT", "Other"],
    default: [],
  },
  duration: {
    type: String,
    enum: ["longterm", "shortterm"],
    required: true
  },


  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Requirement", requirementSchema);
