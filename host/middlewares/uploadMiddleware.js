import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Kiểm tra xem thư mục "uploads/materials" có tồn tại hay không, nếu không thì tạo mới
const ensureUploadsFolderExists = () => {
  const dir = 'uploads/materials';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsFolderExists(); 
    cb(null, 'uploads/materials/'); 
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); 
  }  
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, 
});
export const checkFileExists = (req, res) => {
  const { fileName } = req.query;
  const filePath = path.join(__dirname, 'uploads', fileName);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(200).json({ exists: false }); 
    }
    res.status(200).json({ exists: true }); 
  });
};
export default upload;
