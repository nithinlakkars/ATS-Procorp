// controller/requirementController.js
import Requirement from "../model/Requirement.js";
import { sendEmail } from "../utils/emailSender.js";

// 🎯 Submit requirement with custom ID
export const submitRequirement = async (req, res) => {
  console.log("REQ.BODY DURATION:", req.body.duration);
  const {
    title,
    description,
    leadEmails,
    recruiterAssignedTo,
    locations,
    employmentType,
    workSetting,
    rate,
    primarySkills,
    priority,
    client,
    workAuthorization,
    duration,
    requirementStatus = "open", // ✅ New field default to "open"
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  const now = new Date();
  const formattedTime = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const cleanTitle = title.replace(/\s+/g, "").substring(0, 10);
  const customRequirementId = `${cleanTitle}_${formattedTime}`;

  try {
    const newReq = await Requirement.create({
      requirementId: customRequirementId,
      title,
      description,
      createdBy: req.user.email,
      leadAssignedTo: leadEmails,
      recruiterAssignedTo: recruiterAssignedTo || [],
      recruiterAssignedBy:
        recruiterAssignedTo?.length > 0 ? [req.user.email] : [],
      status:
        recruiterAssignedTo?.length > 0 ? "recruiterAssigned" : "leadAssigned",
      locations,
      employmentType,
      workSetting,
      rate,
      primarySkills,
      priority: priority || "Medium",
      client,
      workAuthorization,
      duration,
      requirementStatus, // ✅ Added here
    });

    // 📧 Notify each lead
    for (const email of leadEmails) {
      const subject = `📢 New Requirement Assigned - ${customRequirementId}`;
      const html = `
        <h3>Hello,</h3>
        <p>You have been assigned a new requirement:</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Client:</strong> ${client}</p>
        <p><strong>Location:</strong> ${locations?.join(", ")}</p>
        <p>Please log in to your dashboard to review and take action.</p>
      `;
      try {
        await sendEmail({ to: email, subject, html });
      } catch (err) {
        console.error(`❌ Failed to send email to ${email}:`, err.message);
      }
    }

    return res.status(201).json({
      newReq,
      status: "success",
      message: "Requirement submitted and leads notified.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to submit requirement",
      error: err.message,
    });
  }
};





export const viewSalesRequirements = async (req, res) => {
  try {
    const email = req.user.email;
    const data = await Requirement.find({ createdBy: email }).sort({
      createdAt: -1,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requirements" });
  }
};
export const recruiterViewRequirements = async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    const data = await Requirement.find({
      recruiterAssignedTo: { $in: [email] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      data,
      message: "✅ Requirements fetched successfully",
      status: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requirements" });
  }
};



export const assignMultipleRequirements = async (req, res) => {
  const { requirementIds, recruiterEmails, leadEmail } = req.body;

  if (
    !requirementIds ||
    !Array.isArray(requirementIds) ||
    !recruiterEmails ||
    !Array.isArray(recruiterEmails) ||
    !leadEmail
  ) {
    return res.status(400).json({ message: "❌ Missing or invalid fields" });
  }

  try {
    const lowercasedEmails = recruiterEmails.map(email => email.toLowerCase());

    const result = await Requirement.updateMany(
      { _id: { $in: requirementIds } },
      {
        $set: {
          recruiterAssignedTo: lowercasedEmails,
          status: "recruiterAssigned",
        },
        $addToSet: {
          recruiterAssignedBy: leadEmail.toLowerCase(),
        },
      }
    );

    // ✉️ Send email to each recruiter for each requirement
    const assignedRequirements = await Requirement.find({
      _id: { $in: requirementIds },
    });

    for (const req of assignedRequirements) {
      for (const email of lowercasedEmails) {
        console.log(`📨 Sending email to ${email} for requirement ${req.requirementId}`);
        await sendEmail({
          to: email,
          subject: `📢 New Requirement Assigned - ${req.title}`,
          html: `
            <h2>ATS Notification</h2>
            <p>Hello Recruiter,</p>
            <p>You have been assigned a new requirement:</p>
            <ul>
              <li><strong>Requirement ID:</strong> ${req.requirementId}</li>
              <li><strong>Title:</strong> ${req.title}</li>
              <li><strong>Location:</strong> ${req.locations?.join(", ") || "N/A"}</li>
              <li><strong>Employment Type:</strong> ${req.employmentType || "N/A"}</li>
             
            </ul>
            <p>Please log in to your dashboard to start submitting candidates.</p>
            <p>Best regards,<br/>ATS Team</p>
          `,
        });
        console.log(`📧 Email sent to ${email}`);
      }
    }

    res.status(200).json({
      message: `✅ Assigned ${lowercasedEmails.length} recruiter(s) to ${requirementIds.length} requirement(s).`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ assignMultipleRequirements error:", error);
    res.status(500).json({ message: "❌ Internal server error", error });
  }
};


export const unassignedRequirements = async (req, res) => {
  try {
    const leadEmail = req.user?.email;
    const role = req.user?.role;

    if (role !== "lead") {
      return res.status(403).json({ error: "Forbidden - Only leads can access this." });
    }

    const reqs = await Requirement.find({
      leadAssignedTo: leadEmail,
      $or: [
        { recruiterAssignedTo: { $exists: false } },
        { recruiterAssignedTo: { $size: 0 } },
      ],
    });

    return res.status(200).json(reqs);
  } catch (err) {
    console.error("❌ Error in unassignedRequirements:", err.message);
    return res.status(500).json({ error: "Failed to load unassigned requirements" });
  }
};





export const myLeadRequirements = async (req, res) => {
  try {
    const email = req.user.email;
    const reqs = await Requirement.find({ leadAssignedTo: email });
    res.json(reqs);
  } catch (err) {
    res.status(500).json({ error: "Failed to load your requirements" });
  }
};

export const assignRequirement = async (req, res) => {
  const { recruiterEmails, leadEmail } = req.body;

  if (!Array.isArray(recruiterEmails) || recruiterEmails.length === 0) {
    return res
      .status(400)
      .json({ message: "❌ At least one recruiter must be selected" });
  }

  try {
    const lowercasedEmails = recruiterEmails.map(email => email.toLowerCase());

    const updatedReq = await Requirement.findByIdAndUpdate(
      req.params.reqId,
      {
        recruiterAssignedTo: lowercasedEmails,
        $addToSet: { recruiterAssignedBy: leadEmail.toLowerCase() },
        status: "recruiterAssigned",
      },
      { new: true }
    );

    console.log("🧾 Updated Requirement:", updatedReq);

    for (const email of lowercasedEmails) {
      console.log("📨 Sending email to:", email);
      await sendEmail({
        to: email,
        subject: `📢 New Requirement Assigned - ${updatedReq.title}`,
        html: `
          <h2>ATS Notification</h2>
          <p>Hello Recruiter,</p>
          <p>You have been assigned a new requirement:</p>
          <ul>
            <li><strong>Requirement ID:</strong> ${updatedReq.requirementId}</li>
            <li><strong>Title:</strong> ${updatedReq.title}</li>
            <li><strong>Location:</strong> ${updatedReq.locations?.join(", ") || "N/A"}</li>
            <li><strong>Employment Type:</strong> ${updatedReq.employmentType || "N/A"}</li>
            <li><strong>Priority:</strong> ${updatedReq.priority || "N/A"}</li>
          </ul>
          <p>Please log in to your dashboard to start submitting candidates.</p>
          <p>Best regards,<br/>ATS Team</p>
        `,
      });
      console.log("📧 Email sent to:", email);
    }

    res.json({ message: "✅ Requirement assigned and emails sent to recruiters" });
  } catch (error) {
    console.error("❌ Assignment or email error:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};



export const viewAllRequirements = async (req, res) => {
  try {
    const data = await Requirement.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all requirements" });
  }
};

export const viewUnassignedLeads = async (req, res) => {
  try {
    const data = await Requirement.find({
      $or: [
        { recruiterAssignedTo: { $exists: false } },
        { recruiterAssignedTo: { $size: 0 } },
      ],
    }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load unassigned requirements" });
  }
};

export const authenticatedLeadRequirements = async (req, res) => {
  try {
    const requirements = await Requirement.find({
      leadAssignedTo: req.user.email,
    });
    res.json(requirements);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requirements" });
  }
};
export const updateRequirementStatus = async (req, res) => {
  try {
    const { requirementId, requirementStatus } = req.body;

    if (!requirementId || !requirementStatus) {
      return res.status(400).json({ message: "Missing data" });
    }

    const updated = await Requirement.findByIdAndUpdate(
      requirementId,
      { requirementStatus },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    console.log("✅ Updated Requirement Status:", updated.requirementStatus);
    res.status(200).json({ message: "Requirement status updated", data: updated });
  } catch (err) {
    console.error("Error updating requirement status:", err);
    res.status(500).json({ message: "Server error" });
  }
};



