/**
 * Authentication Controller
 */

const authService = require('../services/auth.service');
const response = require('../utils/response');

class AuthController {
  async login(req, res, next) {
    try {
      const { subdomain, email, password } = req.body;

      const result = await authService.login(subdomain, email, password);

      response.success(res, 'Login successful', result);
    } catch (error) {
      if (
        error.message === 'Invalid email or password' ||
        error.message === 'School account is inactive'
      ) {
        return response.error(res, 'Invalid email or password', null, 401);
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      if (req.token) {
        await authService.blacklistToken(req.token);
      }
      response.success(res, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  async verifySchool(req, res, next) {
    try {
      const { subdomain } = req.body;

      if (!subdomain) {
        return response.error(res, 'Subdomain is required', null, 400);
      }

      const result = await authService.verifySchool(subdomain);

      response.success(res, 'School verified', result);
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.userId;
      const schoolId = req.user.schoolId;

      const user = await authService.getCurrentUser(userId, schoolId);

      response.success(res, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email, subdomain } = req.body;
      const result = await authService.forgotPassword(email, subdomain);
      response.success(res, 'If this account exists, a password reset link has been sent.', result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      response.success(res, 'Password reset successfully. You can now login with your new password.', result);
    } catch (error) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }
}

module.exports = new AuthController();
