import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureUploadsFolderExists = () => {
  const dir = path.join(__dirname, '../uploads/materials');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsFolderExists(); 
    cb(null, path.join(__dirname, '../uploads/materials')); 
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); 
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, 
});

export const downloadFile = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads/materials', filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, filename, (downloadErr) => {
      if (downloadErr) {
        res.status(500).json({ 
          message: "Failed to download file", 
          error: downloadErr.message 
        });
      }
    });
  });
};

export default upload;
