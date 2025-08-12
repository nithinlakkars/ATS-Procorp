import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import path from "path";

const CREDENTIALS_PATH = path.join("config", "client_secret.json");
const TOKEN_PATH = path.join("config", "token.json");

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
const { client_secret, client_id, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent select_account", // 👈 forces user to select another Google account
});

console.log("\n🔗 Open this URL in your browser and sign in with your NEW Google account:\n");
console.log(authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("\n📥 Paste the authorization code here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error("❌ Error retrieving token", err);
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log("✅ Token stored to", TOKEN_PATH);
    });
});
