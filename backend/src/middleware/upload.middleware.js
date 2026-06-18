/**
 * Upload Middleware - Multer Upload Handling
 */

const multer = require('../config/multer');

const uploadMiddleware = multer.single('file');

module.exports = uploadMiddleware;
