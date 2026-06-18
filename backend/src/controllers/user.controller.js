/**
 * User Controller
 */

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
      const { id } = req.user;
      const updateData = req.body;

      response.success(res, 'Profile updated', {});
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      response.success(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
