/**
 * Multer Upload Configuration
 */

const multer = require('multer');
const path = require('path');

// File filter to accept only images and documents
const fileFilter = (req, file, cb) => {
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  const allowedMimes = [...allowedImageMimes, ...allowedDocMimes];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};

// Storage configuration
const storage = multer.memoryStorage(); // Use memory storage for Cloudinary upload

const uploadConfig = {
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
};

module.exports = multer(uploadConfig);
