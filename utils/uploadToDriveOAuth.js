import { google } from "googleapis";
import fs from "fs";
import path from "path";
import stream from "stream";
import express from "express";

// --- Load credentials dynamically ---
let oAuth2Client;

// Check if environment variable GOOGLE_CLIENT_SECRET_JSON exists
if (process.env.GOOGLE_CLIENT_SECRET_JSON) {
  // ✅ Production: Use environment variable
  const credentials = JSON.parse(process.env.GOOGLE_CLIENT_SECRET_JSON);
  const token = process.env.GOOGLE_TOKEN_JSON
    ? JSON.parse(process.env.GOOGLE_TOKEN_JSON)
    : null;

  const { client_id, client_secret, redirect_uris } = credentials.web || credentials.installed;

  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (token) {
    oAuth2Client.setCredentials(token);
  }
} else {
  // ✅ Development: Use local JSON files
  const credentialsPath = path.join(process.cwd(), "config", "client_secret.json");
  const tokenPath = path.join(process.cwd(), "config", "token.json");

  if (!fs.existsSync(credentialsPath) || !fs.existsSync(tokenPath)) {
    console.warn("⚠️  Missing local credentials. Running in dev mode without OAuth.");
    oAuth2Client = null;
  } else {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
    const { client_id, client_secret, redirect_uris } = credentials.web || credentials.installed;

    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);
  }
}

// --- Google Drive client ---
const drive = oAuth2Client ? google.drive({ version: "v3", auth: oAuth2Client }) : null;

// --- Helper functions ---
export const getMainFolderId = async () => {
  if (!drive) throw new Error("Google Drive client not initialized");

  const mainFolderName = "ATS_DOCUMENTS";
  try {
    const res = await drive.files.list({
      q: `name='${mainFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (res.data.files.length > 0) return res.data.files[0].id;

    const folder = await drive.files.create({
      requestBody: { name: mainFolderName, mimeType: "application/vnd.google-apps.folder" },
      fields: "id",
    });

    return folder.data.id;
  } catch (error) {
    console.error("Error getting/creating main folder:", error.message);
    throw error;
  }
};

export const createCandidateFolder = async (folderName) => {
  if (!drive) throw new Error("Google Drive client not initialized");

  const mainFolderId = await getMainFolderId();
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [mainFolderId],
    },
    fields: "id",
  });

  return folder.data.id;
};

export const uploadToDrive = async (filename, fileBuffer, mimetype, folderId) => {
  if (!drive) throw new Error("Google Drive client not initialized");

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const fileMetadata = { name: filename, parents: [folderId] };
  const media = { mimeType, body: bufferStream };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, webContentLink",
  });

  return response.data;
};

// --- Express Router for OAuth ---
const router = express.Router();

if (oAuth2Client) {
  router.get("/api/auth/google", (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file"],
      prompt: "consent",
    });
    res.redirect(authUrl);
  });

  router.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send("No code received");

    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      // Optionally save token locally for development
      if (process.env.NODE_ENV !== "production") {
        fs.writeFileSync(path.join(process.cwd(), "config", "token.json"), JSON.stringify(tokens));
      }

      res.send("✅ Google Drive connected! Token generated successfully.");
    } catch (err) {
      console.error("Error generating token:", err.message);
      res.status(500).send("Error generating token");
    }
  });
}

export default router;
