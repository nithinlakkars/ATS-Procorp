// googleDriveService.js
import stream from "stream";
import { createCandidateFolder as createFolder, uploadToDrive as uploadFile } from "../utils/googleDrive.js";

/**
 * Create a folder in Google Drive for a candidate
 * @param {string} candidateId
 * @returns {Object} { success: boolean, folderId?: string, error?: string }
 */
export const createFolderInDrive = async (candidateId) => {
  try {
    console.log("📁 Creating folder in Google Drive...");

    const folderName = `candidate_${candidateId}`;
    const folderId = await createFolder(folderName);

    return { success: true, folderId };
  } catch (error) {
    console.error("❌ Error in createFolderInDrive:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Upload a file to an existing Google Drive folder
 * @param {string} filename - Name of the file
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} mimetype - MIME type of the file
 * @param {string} folderId - Google Drive folder ID
 * @returns {Object} Uploaded file info
 */
export const uploadToDrive = async (filename, fileBuffer, mimetype, folderId) => {
  try {
    const response = await uploadFile(filename, fileBuffer, mimetype, folderId);
    console.log(`✅ Uploaded file: ${response.webViewLink}`);
    return response;
  } catch (error) {
    console.error("❌ Error uploading file to Drive:", error.message);
    throw error;
  }
};
