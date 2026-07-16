/**
 * Multer Upload Configuration
 */

const multer = require('multer');
const path = require('path');

// File filter to accept images, videos, PDFs, and office documents
const fileFilter = (req, file, cb) => {
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  const allowedDocMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  const allowedMimes = [...allowedImageMimes, ...allowedVideoMimes, ...allowedDocMimes];
  
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
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter,
};

module.exports = multer(uploadConfig);
