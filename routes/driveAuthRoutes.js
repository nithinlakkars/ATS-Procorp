// src/routes/driveAuthRoutes.js
import express from "express";
import { google } from "googleapis";

const router = express.Router();

// Load credentials from env or JSON
const credentials = {
  web: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [process.env.GOOGLE_REDIRECT_URI],
  },
};

const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = ["https://www.googleapis.com/auth/drive"];

// Step 1: Auth URL
router.get("/auth", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(authUrl);
});

// Step 2: Callback URL
router.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("❌ No code provided");

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    // Send JSON token back to user
    res.json({ message: "✅ Tokens generated!", tokens });
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error retrieving tokens");
  }
});

export default router;
