import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    rate: String,
    source: String,
    currentLocation: String,
    relocation: {
      type: String,
      enum: ["Yes", "No", "yes", "no"],
    },
    passportnumber: String,
    Last4digitsofSSN: String,
    LinkedinUrl: String,
    resumeUrls: [String],
    VisaStatus: String,
    clientdetails: String,
    folderId: { type: String },
    folderUrl: { type: String },

    addedBy: {
      type: String, // Recruiter email
    },
    forwardedBy: {
      type: String, // Lead email who forwarded to Sales
    },

    notes: String,

    // 🔗 Linked Requirements (can support multiple)
    requirementId: [
      {
        type: String, // Custom req ID (e.g., JavaDev_142355)
        required: true,
      },
    ],

    // 🚦 Source of submission
    sourceRole: {
      type: String,
      required: true, // recruiter or lead
    },

    // 🔄 Workflow Status
    status: {
      type: String,
      enum: ["submitted", "forwarded-to-leads", "forwarded-to-sales"],
      default: "submitted",
    },
    isActive: {
      type: Boolean,
      default: false
    },
    candidate_update: {
      type: String,
        enum: ["L1-cleared", "selected", "rejected", "Waiting-for-update", "To-be-interviewed", "Decision-pending", "submitted","internal-rejection","submitted-to-client"],

    },
lead_update: {
  type: String,
  enum: [
    "",
    "L1-cleared",
    "selected",
    "rejected",
    "Waiting-for-update",
    "To-be-interviewed",
    "Decision-pending",
    "internal-rejection",
    "submitted-to-client"
  ],
  default: ""
},



    // 🧹 Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Candidate", candidateSchema);
