// utils/googleDrive.js
import { google } from "googleapis";
import stream from "stream";

/**
 * Google Drive utility using OAuth2 client and token from environment variables.
 * Environment variables required:
 * GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_TOKEN_JSON
 */

// 1️⃣ Load OAuth2 credentials and token
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_TOKEN_JSON } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !GOOGLE_TOKEN_JSON) {
  throw new Error("❌ Missing required Google OAuth environment variables");
}

const token = JSON.parse(GOOGLE_TOKEN_JSON);

// 2️⃣ Setup OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials(token);

// 3️⃣ Create Drive client
const drive = google.drive({ version: "v3", auth: oAuth2Client });

/**
 * Create a candidate folder in Google Drive
 * @param {string} folderName
 * @returns {string} Folder ID
 */
export const createCandidateFolder = async (folderName) => {
  try {
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id",
    });

    console.log("✅ Created folder:", folder.data.id);
    return folder.data.id;
  } catch (error) {
    console.error("❌ Error creating folder:", error.message);
    throw error;
  }
};

/**
 * Upload a file to Google Drive
 * @param {string} filename - Name of the file
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} mimetype - File MIME type
 * @param {string} folderId - Google Drive folder ID
 * @returns {object} Uploaded file info
 */
export const uploadToDrive = async (filename, fileBuffer, mimetype, folderId) => {
  try {
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
      fields: "id, name, webViewLink, webContentLink",
    });

    console.log("✅ Uploaded file:", response.data.webViewLink);
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading file:", error.message);
    throw error;
  }
};
