// utils/googleDrive.js
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import stream from "stream";

// Local file paths (used only in development)
const TOKEN_PATH = path.join(path.resolve(), "config", "token.json");
const CREDENTIALS_PATH = path.join(path.resolve(), "config", "client_secret.json");

/**
 * Get authenticated Google OAuth client
 */
export const getAuthenticatedClient = async () => {
  let credentials;

  // 1️⃣ Load credentials
  if (process.env.GOOGLE_CREDENTIALS) {
    console.log("✅ Using GOOGLE_CREDENTIALS from environment");
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } else if (fs.existsSync(CREDENTIALS_PATH)) {
    console.log("📄 Using local client_secret.json");
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  } else {
    throw new Error("❌ Google credentials not found (GOOGLE_CREDENTIALS env var or local file).");
  }

  const { client_secret, client_id, redirect_uris } = credentials.web;

  // 2️⃣ Determine redirect URI
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://procorp-ats.onrender.com/oauth2callback"
      : redirect_uris[0];

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  // 3️⃣ Load token
  let token;
  if (process.env.GOOGLE_TOKEN) {
    console.log("✅ Using GOOGLE_TOKEN from environment");
    token = JSON.parse(process.env.GOOGLE_TOKEN);
  } else if (fs.existsSync(TOKEN_PATH)) {
    console.log("📄 Using local token.json");
    token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  } else {
    throw new Error("❌ Google token not found (GOOGLE_TOKEN env var or local file).");
  }

  // 4️⃣ Set credentials
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
};

/**
 * Create a candidate folder in Google Drive
 */
export const createCandidateFolder = async (candidateId) => {
  const auth = await getAuthenticatedClient();
  const drive = google.drive({ version: "v3", auth });

  const folderMetadata = {
    name: `candidate_${candidateId}`,
    mimeType: "application/vnd.google-apps.folder",
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  });

  console.log("✅ Created new folder:", folder.data.id);
  return folder.data.id;
};

/**
 * Upload a file to Google Drive
 */
export const uploadToDrive = async (filename, fileBuffer, mimetype, folderId) => {
  const auth = await getAuthenticatedClient();
  const drive = google.drive({ version: "v3", auth });

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };

  const media = {
    mimeType: mimetype,
    body: bufferStream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, webContentLink, parents",
  });

  console.log("✅ Uploaded file:", response.data.webViewLink);
  return response.data;
};
