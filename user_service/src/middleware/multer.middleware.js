import multer from "multer"
import path from "path"
import crypto from "crypto"
import fs from "fs"


const ALLOWED_MIME = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image',
  'video/mp4': 'video', 'video/webm': 'video'
};
const MAX_SIZE = 50 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || req.user?._id;
    const dir = path.join('uploads', String(userId || 'unknown-user')); // req.user set by auth middleware
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // never trust the original filename — generate our own
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME[file.mimetype]) {
    return cb(new Error('Unsupported file type'), false);
  }
  cb(null, true);
};

export const upload=multer({
  storage,
  fileFilter,
  limits:{fileSize:MAX_SIZE}
})
export default upload