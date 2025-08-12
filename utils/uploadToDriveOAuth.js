// utils/googleDrive.js
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import stream from "stream";

const TOKEN_PATH = path.join(path.resolve(), "config", "token.json");
const CREDENTIALS_PATH = path.join(path.resolve(), "config", "client_secret.json");

export const getAuthenticatedClient = async () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    oAuth2Client.setCredentials(token);
  } else {
    throw new Error("❌ Token file not found.");
  }

  return oAuth2Client;
};

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
