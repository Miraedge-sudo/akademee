/**
 * Authentication Controller
 */

const sql = require('../config/database');
const authService = require('../services/auth.service');
const jwtConfig = require('../config/jwt');
const response = require('../utils/response');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

const ACCESS_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, maxAge: jwtConfig.accessCookieMaxAgeMs };
const REFRESH_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, maxAge: jwtConfig.refreshCookieMaxAgeMs };

function setAuthCookies(res, token, refreshToken) {
  res.cookie('access_token', token, ACCESS_COOKIE_OPTIONS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

class AuthController {
  async login(req, res, next) {
    try {
      const { subdomain, email, password } = req.body;

      const result = await authService.login(subdomain, email, password);

      setAuthCookies(res, result.token, result.refreshToken);

      response.success(res, 'Login successful', {
        user: result.user,
        token: result.token,
        urls: result.urls,
      });
    } catch (error) {
      if (error.message === 'User account is inactive') {
        return response.error(res, 'Your account is inactive. Please contact your administrator.', null, 401);
      }
      if (
        error.message === 'Invalid email or password' ||
        error.message === 'School account is inactive'
      ) {
        return response.error(res, 'Invalid email or password', null, 401);
      }
      if (error.message === 'School email is not verified') {
        return response.error(res, 'Please verify your school email before starting onboarding.', null, 403);
      }
      if (error.message === 'Admin email is not verified') {
        return response.error(res, 'Please verify your admin email before signing in.', null, 403);
      }
      next(error);
    }
  }

  async exchangeToken(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) return response.error(res, 'Token is required', null, 400);

      const jwt = require('jsonwebtoken');
      const jwtConfig = require('../config/jwt');
      const decoded = jwt.verify(token, jwtConfig.secret);

      const user = await authService.getCurrentUser(decoded.userId, decoded.schoolId);

      const roles = decoded.roles || [];
      const schools = await sql`
        SELECT s.school_id, s.name, s.subdomain, s.is_active, s.onboarding_completed, wt.template_code
        FROM schools s
        LEFT JOIN website_templates wt ON s.website_template_id = wt.template_id
        WHERE s.school_id = ${decoded.schoolId}
      `;
      if (schools.length === 0) return response.error(res, 'School not found', null, 404);

      const result = await authService.createAuthSession(
        { user_id: decoded.userId, school_id: decoded.schoolId, email: decoded.email, first_name: decoded.firstName, last_name: decoded.lastName },
        schools[0],
        roles
      );

      setAuthCookies(res, result.token, result.refreshToken);
      response.success(res, 'Session established', { user, token: result.token });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return response.error(res, 'Invalid or expired token', null, 401);
      }
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) return response.error(res, 'No refresh token', null, 401);

      const result = await authService.refreshTokens(refreshToken);

      setAuthCookies(res, result.token, result.refreshToken);
      response.success(res, 'Tokens refreshed', { user: result.user, token: result.token });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        clearAuthCookies(res);
        return response.error(res, 'Session expired. Please login again.', null, 401);
      }
      if (error.message === 'Invalid refresh token' || error.message === 'User not found' || error.message === 'School not found') {
        clearAuthCookies(res);
        return response.error(res, 'Session expired. Please login again.', null, 401);
      }
      if (error.message === 'School email is not verified' || error.message === 'Admin email is not verified') {
        clearAuthCookies(res);
        return response.error(res, error.message, null, 403);
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.token || req.cookies?.access_token;
      if (token) {
        await authService.blacklistToken(token);
      }
      clearAuthCookies(res);
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

  async verifyAdminEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return response.error(res, 'Verification token is required', null, 400);
      }

      const result = await authService.verifyAdminEmail(token);
      response.success(res, result.alreadyVerified ? 'Email already verified' : 'Email verified successfully', result);
    } catch (error) {
      return response.error(res, error.message, null, 400);
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
