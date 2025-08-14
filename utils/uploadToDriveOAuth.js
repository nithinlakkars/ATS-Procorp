import { google } from "googleapis";
import stream from "stream";

// Load OAuth2 credentials from env
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_TOKEN_JSON } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !GOOGLE_TOKEN_JSON) {
  throw new Error("❌ Missing required Google OAuth environment variables");
}

const token = JSON.parse(GOOGLE_TOKEN_JSON);

// Setup OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials(token);

// Create Drive client
const drive = google.drive({ version: "v3", auth: oAuth2Client });

/**
 * Get or create the ATS_DOCUMENTS main folder
 * @returns {Promise<string>} Folder ID
 */
export const getMainFolderId = async () => {
  const mainFolderName = "ATS_DOCUMENTS";
  try {
    // 1️⃣ Search for existing ATS_DOCUMENTS folder
    const res = await drive.files.list({
      q: `name='${mainFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (res.data.files.length > 0) {
      console.log(`📂 Main folder already exists: ${res.data.files[0].id}`);
      return res.data.files[0].id;
    }

    // 2️⃣ Create it if not found
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

/**
 * Create a candidate folder inside ATS_DOCUMENTS
 */
export const createCandidateFolder = async (folderName) => {
  try {
    const mainFolderId = await getMainFolderId(); // ensure main folder exists
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [mainFolderId], // ✅ Put inside ATS_DOCUMENTS
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id",
    });

    console.log("✅ Created candidate folder:", folder.data.id);
    return folder.data.id;
  } catch (error) {
    console.error("❌ Error creating candidate folder:", error.message);
    throw error;
  }
};

/**
 * Upload a file to a candidate folder
 */
export const uploadToDrive = async (filename, fileBuffer, mimetype, folderId) => {
  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
      name: filename,
      parents: [folderId], // upload into candidate folder
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
