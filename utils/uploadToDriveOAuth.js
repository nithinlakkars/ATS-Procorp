import { google } from "googleapis";
import stream from "stream";

// Load service account from environment variable
if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ GOOGLE_SERVICE_ACCOUNT env variable not set");
}

const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// Authenticate with service account
const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

// Create drive client
const drive = google.drive({ version: "v3", auth });

// Create folder
export const createCandidateFolder = async (folderName) => {
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
};

// Upload file
export const uploadToDrive = async (filename, fileBuffer, mimetype, folderId) => {
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
};
