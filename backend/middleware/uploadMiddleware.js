const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Filter function to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Export a middleware function for handling a single file upload named 'avatar'
const uploadAvatar = upload.single('avatar');

module.exports = { uploadAvatar }; 