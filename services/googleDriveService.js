// googleDriveService.js
import { google } from "googleapis";
import { getAuthenticatedClient } from "../utils/uploadToDriveOAuth.js";

import fs from "fs";

// ✅ Create folder
export const createFolderInDrive = async (candidateId) => {
  try {
    console.log("📁 Creating folder in Google Drive...");

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

    return { success: true, folderId: folder.data.id };
  } catch (error) {
    console.error("❌ Error in createFolderInDrive:", error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Upload file to folder
// ✅ Change this to accept existing folderId — no need to recreate
export const uploadToDrive = async (filename, fileBuffer, mimetype, folderId) => {
  const auth = await getAuthenticatedClient();
  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: filename,
    parents: [folderId], // ✅ Use passed folderId directly
  };

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const media = {
    mimeType: mimetype,
    body: bufferStream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, webContentLink",
  });

  return response.data;
};
