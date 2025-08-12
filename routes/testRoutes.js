import express from "express";
import { sendEmail } from "../utils/emailSender.js";

const router = express.Router();

router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "your_email@gmail.com", // Replace with your email
      subject: "🚀 ATS Test Email",
      html: "<p>This is a test email from ATS to verify email setup.</p>",
    });

    console.log("📧 Test email sent to your_email@gmail.com");
    res.send("✅ Test email sent");
  } catch (err) {
    console.error("❌ Email test failed:", err);
    res.status(500).send("❌ Failed to send test email");
  }
});

export default router;
