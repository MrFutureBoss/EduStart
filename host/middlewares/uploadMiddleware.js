import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Submission from "../models/submissionModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureUploadsFolderExists = () => {
  const dir = path.join(__dirname, "../uploads/materials");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsFolderExists();
    cb(null, path.join(__dirname, "../uploads/materials"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const downloadFile = (req, res) => {
  const { filename } = req.params;

  // Tính đường dẫn file
  const filePath = path.join(__dirname, "../uploads/materials", filename);

  // Log để debug
  console.log("Received request to download file:", filename);
  console.log("Computed file path:", filePath);

  // Kiểm tra file tồn tại
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("File not found:", filePath);
      return res.status(404).json({ message: "File not found", filePath });
    }

    // Nếu file tồn tại, gửi file xuống
    res.download(filePath, filename, (downloadErr) => {
      if (downloadErr) {
        console.error("Error during file download:", downloadErr.message);
        return res.status(500).json({
          message: "Failed to download file",
          error: downloadErr.message,
        });
      } else {
        console.log("File downloaded successfully:", filePath);
      }
    });
  });
};

export const downloadSubmission = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required.",
      });
    }
    const submission = await Submission.findOne({
      files: { $in: [`/uploads/materials/${filename}`] },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "File not found in submission data.",
      });
    }

    const filePath = path.join(__dirname, "../uploads/materials", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server.",
      });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error during file download:", err);
        res.status(500).json({
          success: false,
          message: "Error while downloading the file.",
        });
      }
    });
  } catch (error) {
    console.error("Error in downloadSubmission:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while downloading the file.",
    });
  }
};

export const singleUpload = upload.single("file");
export const multipleUpload = upload.array("files", 10);

export default upload;
