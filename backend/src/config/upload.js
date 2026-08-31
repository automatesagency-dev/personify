const multer = require('multer');
const path = require('path');

// Use memory storage to get file buffer (needed for R2 upload)
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|heic/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  // Tagged so the error handler can map it to a 400 without matching on the
  // message text. Note this checks the declared type only — the controllers
  // additionally verify the file's magic bytes before storing it.
  const error = new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, heic)');
  error.code = 'INVALID_FILE_TYPE';
  cb(error);
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload;