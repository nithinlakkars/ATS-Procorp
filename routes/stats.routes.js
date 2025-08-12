import express from "express";
import Requirement from "../model/Requirement.js";
import Candidate from "../model/Candidate.js";

const router = express.Router();

router.get("/sales-dashboard", async (req, res) => {
  try {
    // 📊 Requirement counts
    const activeRequirements = await Requirement.countDocuments({ requirementStatus: "open" });
    const closedRequirements = await Requirement.countDocuments({ requirementStatus: "closed" });

    // 👤 Candidate update status counts
    const candidateStages = [
      "L1-cleared",
      "selected",
      "rejected",
      "Waiting-for-update",
      "To-be-interviewed",
      "Decision-pending",
      "submitted",
    ];

    const candidateStatusCounts = await Candidate.aggregate([
      {
        $match: {
          isDeleted: false,
          candidate_update: { $in: candidateStages },
        },
      },
      {
        $group: {
          _id: "$candidate_update",
          count: { $sum: 1 },
        },
      },
    ]);

    const candidateStats = candidateStages.reduce((acc, status) => {
      const found = candidateStatusCounts.find((s) => s._id === status);
      acc[status] = found ? found.count : 0;
      return acc;
    }, {});

    // ✅ Active/Inactive candidates
    const activeCandidates = await Candidate.countDocuments({ isDeleted: false, isActive: true });
    const inactiveCandidates = await Candidate.countDocuments({ isDeleted: false, isActive: false });

    res.json({
      activeRequirements,
      closedRequirements,
      activeCandidates,
      inactiveCandidates,
      candidateStats,
    });
  } catch (err) {
    console.error("❌ Failed to fetch dashboard stats:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
