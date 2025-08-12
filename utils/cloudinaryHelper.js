// utils/uploadToCloudinary.js
import cloudinary from "../services/cloudinary.js";

export async function uploadToCloudinary(fileBuffer, originalname, folderName) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "raw", // ✅ Important for PDFs
          folder: folderName,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      )
      .end(fileBuffer);
  });
}
