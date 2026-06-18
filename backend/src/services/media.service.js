/**
 * Media Service — uploads school logos, hero images, and gallery photos to Cloudinary.
 * Files are stored per school_id so each tenant only owns its media rows.
 */

const cloudinary = require('../config/cloudinary');
const sql = require('../config/database');

class MediaService {
  cloudinaryReady() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
  }

  async uploadToCloudinary(file, folder) {
    if (!this.cloudinaryReady()) {
      throw new Error('Cloudinary is not configured. Set CLOUDINARY_* in .env');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });
  }

  /**
   * Save uploaded file and link it to the school in school_media.
   */
  async saveSchoolMedia(schoolId, file, mediaType, caption = null, sortOrder = null) {
    const folder = `akademee/schools/${schoolId}/${mediaType}`;
    const upload = await this.uploadToCloudinary(file, folder);

    let order = sortOrder;
    if (mediaType === 'gallery' && order === null) {
      const existing = await sql`
        SELECT COUNT(*)::int AS count FROM school_media
        WHERE school_id = ${schoolId} AND media_type = 'gallery'
      `;
      order = existing[0]?.count || 0;
    }

    const rows = await sql`
      INSERT INTO school_media (school_id, media_type, url, public_id, caption, sort_order, created_at)
      VALUES (${schoolId}, ${mediaType}, ${upload.secure_url}, ${upload.public_id}, ${caption}, ${order ?? 0}, NOW())
      RETURNING media_id, media_type, url, caption, sort_order
    `;

    // Keep schools.logo_url / hero_image_url in sync for quick vitrine reads
    if (mediaType === 'logo') {
      await sql`UPDATE schools SET logo_url = ${upload.secure_url}, updated_at = NOW() WHERE school_id = ${schoolId}`;
    }
    if (mediaType === 'hero') {
      await sql`UPDATE schools SET hero_image_url = ${upload.secure_url}, updated_at = NOW() WHERE school_id = ${schoolId}`;
    }

    return rows[0];
  }

  async listGallery(schoolId) {
    return sql`
      SELECT media_id, url, caption, sort_order
      FROM school_media
      WHERE school_id = ${schoolId} AND media_type = 'gallery'
      ORDER BY sort_order ASC, created_at ASC
    `;
  }
}

module.exports = new MediaService();
