import { google } from "googleapis";
import fs from "fs";
import path from "path";
import stream from "stream";

// --- Load credentials dynamically ---
let oAuth2Client;

const credentialsEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_TOKEN_JSON",
];

// Check if all env variables exist
const hasAllEnvVars = credentialsEnvVars.every((v) => process.env[v]);

if (hasAllEnvVars) {
  // ✅ Use environment variables (production)
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_TOKEN_JSON } = process.env;
  const token = JSON.parse(GOOGLE_TOKEN_JSON);

  oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials(token);

} else {
  // ✅ Use local JSON files (development)
  const credentialsPath = path.join(process.cwd(), "config", "client_secret.json");
  const tokenPath = path.join(process.cwd(), "config", "token.json");

  if (!fs.existsSync(credentialsPath) || !fs.existsSync(tokenPath)) {
    throw new Error("❌ Missing local credentials for development");
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));

  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
}

// --- Google Drive client ---
const drive = google.drive({ version: "v3", auth: oAuth2Client });

// --- Your existing functions ---
export const getMainFolderId = async () => {
  const mainFolderName = "ATS_DOCUMENTS";
  try {
    const res = await drive.files.list({
      q: `name='${mainFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (res.data.files.length > 0) {
      console.log(`📂 Main folder already exists: ${res.data.files[0].id}`);
      return res.data.files[0].id;
    }

    const folder = await drive.files.create({
      requestBody: {
        name: mainFolderName,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    console.log(`✅ Created main folder: ${folder.data.id}`);
    return folder.data.id;
  } catch (error) {
    console.error("❌ Error getting/creating main folder:", error.message);
    throw error;
  }
};

export const createCandidateFolder = async (folderName) => {
  try {
    const mainFolderId = await getMainFolderId();
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [mainFolderId],
      },
      fields: "id",
    });

    console.log("✅ Created candidate folder:", folder.data.id);
    return folder.data.id;
  } catch (error) {
    console.error("❌ Error creating candidate folder:", error.message);
    throw error;
  }
};

export const uploadToDrive = async (filename, fileBuffer, mimetype, folderId) => {
  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
      name: filename,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: bufferStream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink, webContentLink",
    });

    console.log("✅ Uploaded file:", response.data.webViewLink);
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading file:", error.message);
    throw error;
  }
};
import express from "express";
import fs from "fs";
import { google } from "googleapis";

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 1️⃣ Start OAuth flow
router.get("/api/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // allows refresh token
    scope: ["https://www.googleapis.com/auth/drive.file"],
    prompt: "consent", // forces Google to show the consent screen
  });
  res.redirect(authUrl);
});

// 2️⃣ Handle OAuth callback and save token
router.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code received");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save token to a file (or update your environment variable dynamically if needed)
    fs.writeFileSync("token.json", JSON.stringify(tokens));

    res.send("✅ Google Drive connected! Token generated successfully.");
  } catch (err) {
    console.error("❌ Error generating token:", err.message);
    res.status(500).send("Error generating token");
  }
});

export default router;
