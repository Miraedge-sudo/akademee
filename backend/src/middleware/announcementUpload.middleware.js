const multer = require('../config/multer');

const announcementUpload = multer.array('files', 10);

module.exports = announcementUpload;
