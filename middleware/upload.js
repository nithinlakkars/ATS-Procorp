// import multer from "multer";
// import path from "path";

// // Multer Resume Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) =>
//     cb(null, Date.now() + path.extname(file.originalname)),
// });

// const upload = multer({ storage });

// export default upload;

import multer from "multer";

const storage = multer.memoryStorage(); // use memory storage for uploading to S3
const upload = multer({ storage });

export default upload;
