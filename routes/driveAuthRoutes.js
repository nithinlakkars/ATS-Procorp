import express from "express";
import fs from "fs";
import { google } from "googleapis";

const router = express.Router();

// Load credentials
const CREDENTIALS_PATH = "./config/client_secret.json";
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// Step 1: Start OAuth flow
router.get("/auth", (req, res) => {
    const url = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
    });
    res.redirect(url);
});

// Step 2: OAuth callback
router.get("/oauth2callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("❌ No code received");

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        console.log("✅ Refresh token:", tokens.refresh_token);

        // Send a simple message to browser
        res.send("✅ Authorization complete! Check server logs for refresh token.");
    } catch (err) {
        console.error("❌ OAuth2 callback error:", err);
        res.status(500).send("❌ Authorization failed");
    }
});

export default router;
