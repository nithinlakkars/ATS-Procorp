import { uploadToDrive } from "./utils/uploadToDriveOAuth.js";
import path from "path";

const run = async () => {
  try {
    const filePath = path.join(process.cwd(), "resume.pdf");
    const result = await uploadToDrive("test_resume.pdf", filePath, "application/pdf");
    console.log("✅ Uploaded successfully:");
    console.log(result);
  } catch (error) {
    console.error("❌ Upload failed:");
    console.error(error.message || error);
  }
};

run();
