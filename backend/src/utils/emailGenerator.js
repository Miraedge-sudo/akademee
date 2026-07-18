/**
 * Email Generator Utility
 * Generates login emails by appending role to the original email.
 *
 * Original email (provided by admin) stays unchanged for display/records.
 * Login email (used for authentication) gets the role extension.
 *
 * Examples:
 *   mokomosas@gmail.com + TEACHER   → mokomosas.teacher@gmail.com
 *   mokomosas@gmail.com + STUDENT   → mokomosas.student@gmail.com
 *   mokomosas@gmail.com + ADMIN     → mokomosas@gmail.com (no change)
 */

/**
 * Generate a login email by appending role extension to the original email
 * @param {string} originalEmail - The email provided by admin (e.g. mokomosas@gmail.com)
 * @param {string} role - User's role (TEACHER, STUDENT, ACCOUNTANT, SECRETARY, PARENT, ADMIN)
 * @returns {string} Login email with role extension (e.g. mokomosas.teacher@gmail.com)
 */
function generateLoginEmail(originalEmail, role) {
  if (!originalEmail) return originalEmail;

  const normalizedRole = (role || '').toLowerCase().replace(/[^a-z]/g, '');

  // Admin keeps their original email — no extension
  if (!normalizedRole || normalizedRole === 'admin') {
    return originalEmail;
  }

  // Split email into local part and domain
  const atIndex = originalEmail.indexOf('@');
  if (atIndex === -1) return originalEmail;

  const localPart = originalEmail.substring(0, atIndex);
  const domain = originalEmail.substring(atIndex + 1);

  return `${localPart}.${normalizedRole}@${domain}`;
}

module.exports = {
  generateLoginEmail,
};
