/**
 * Image URL optimization — Cloudinary on-the-fly transformations.
 *
 * Stored image URLs (schools.logo_url, hero_image_url, school_media.url,
 * users.avatar_url, about_photos) are plain Cloudinary secure_urls. Instead of
 * re-uploading, we inject transformation parameters directly into the URL so
 * Cloudinary's CDN serves the optimized format/size on the fly:
 *
 *   f_auto  → WebP/AVIF based on browser support (huge size savings)
 *   q_auto  → optimal quality/compression ratio
 *   w_/h_/c_fill → resize to the display size (fewer bytes transferred)
 *
 * This requires no DB migration and applies to ALL existing images.
 */

const CLOUDINARY_URL =
  /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)(.*)$/;

/**
 * Inject Cloudinary transformation params into an existing URL.
 *
 * @param {string|null} url  - Stored Cloudinary secure_url (or any URL).
 * @param {object} [options]
 * @param {number} [options.width]  - Target width (e.g. 800).
 * @param {number} [options.height] - Target height.
 * @param {string} [options.fit]    - Crop fit mode (default 'fill' when resizing).
 * @param {boolean} [options.format = true] - Apply f_auto (WebP/AVIF). Set false
 *                                            for PDF/print-safe output.
 * @param {boolean} [options.quality = true] - Apply q_auto.
 * @returns {string} The transformed URL, or the original when not transformable.
 */
function optimizeImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url;

  const match = url.match(CLOUDINARY_URL);
  if (!match) return url; // Not a Cloudinary URL — leave untouched.

  const [, base] = match;
  const transforms = [];

  if (options.format !== false) transforms.push('f_auto');
  if (options.quality !== false) transforms.push('q_auto');

  const { width, height, fit } = options;
  if (width || height) {
    const crop = fit || 'fill';
    const parts = [`c_${crop}`];
    if (width) parts.push(`w_${width}`);
    if (height) parts.push(`h_${height}`);
    transforms.push(parts.join(','));
  }

  if (transforms.length === 0) return url;

  // Cloudinary applies transformations in the order they appear: insert ours
  // right after "/upload/" so they run before any existing ones.
  return `${base}${transforms.join('/')}/${match[2]}`;
}

module.exports = { optimizeImageUrl };
