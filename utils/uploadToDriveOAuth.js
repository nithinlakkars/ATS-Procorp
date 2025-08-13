// utils/googleDrive.js
import { google } from "googleapis";
import stream from "stream";

/**
 * Google Drive utility using Service Account via environment variable.
 * No local JSON file needed.
 * 
 * Environment variable required:
 * GOOGLE_CREDENTIALS = JSON content of the service account key
 */

// 1️⃣ Load service account from environment variable
if (!process.env.GOOGLE_CREDENTIALS) {
  throw new Error("❌ GOOGLE_CREDENTIALS env variable not set");
}

const serviceAccountKey = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// 2️⃣ Authenticate with service account
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountKey,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

// 3️⃣ Create drive client
const drive = google.drive({ version: "v3", auth });

/**
 * Create a candidate folder in Google Drive
 * @param {string} folderName - Name of the folder
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
