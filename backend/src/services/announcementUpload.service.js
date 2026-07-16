const cloudinary = require('../config/cloudinary');

const MEGA = 1024 * 1024;
const MAX_FILE_SIZE = 50 * MEGA;

function cloudinaryReady() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function uploadToCloudinary(file, schoolId) {
  if (!cloudinaryReady()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_* in .env');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File ${file.originalname} exceeds the 50MB limit`);
  }

  const folder = `akademee/schools/${schoolId}/announcements`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

async function uploadFiles(files, schoolId) {
  if (!files || files.length === 0) return [];
  const results = await Promise.allSettled(
    files.map((file) => uploadToCloudinary(file, schoolId))
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') {
      return {
        url: r.value.secure_url,
        publicId: r.value.public_id,
        fileName: files[i].originalname,
        fileType: files[i].mimetype,
        resourceType: r.value.resource_type,
        bytes: r.value.bytes,
      };
    }
    return {
      fileName: files[i].originalname,
      fileType: files[i].mimetype,
      error: r.reason?.message || 'Upload failed',
    };
  });
}

module.exports = { uploadFiles };
