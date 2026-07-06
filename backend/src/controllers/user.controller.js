const bcrypt = require('bcrypt');
const sql = require('../config/database');
const response = require('../utils/response');

class UserController {
  async getProfile(req, res, next) {
    try {
      const { user } = req;
      response.success(res, 'Profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { firstName, lastName, phone, avatarUrl } = req.body;
      const rows = await sql`
        UPDATE users SET
          first_name = COALESCE(${firstName || null}, first_name),
          last_name = COALESCE(${lastName || null}, last_name),
          phone = COALESCE(${phone || null}, phone),
          avatar_url = COALESCE(${avatarUrl || null}, avatar_url)
        WHERE user_id = ${userId}
        RETURNING user_id, first_name, last_name, email, phone, avatar_url
      `;
      if (rows.length === 0) return response.error(res, 'User not found', null, 404);
      const u = rows[0];
      response.success(res, 'Profile updated', {
        userId: u.user_id, firstName: u.first_name, lastName: u.last_name,
        email: u.email, phone: u.phone, avatarUrl: u.avatar_url,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return response.error(res, 'Current password and new password are required', null, 400);
      }
      if (newPassword.length < 8) {
        return response.error(res, 'New password must be at least 8 characters', null, 400);
      }
      const users = await sql`SELECT password_hash FROM users WHERE user_id = ${userId}`;
      if (users.length === 0) return response.error(res, 'User not found', null, 404);
      const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!valid) return response.error(res, 'Current password is incorrect', null, 400);
      const hash = await bcrypt.hash(newPassword, 10);
      await sql`UPDATE users SET password_hash = ${hash} WHERE user_id = ${userId}`;
      response.success(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
