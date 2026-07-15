const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const authService = require('../services/auth.service');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization required.',
      });
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    req.token = token;

    const blacklisted = await authService.isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.',
      });
    }

    if (decoded.schoolId) {
      req.schoolId = decoded.schoolId;
      req.tenantId = decoded.schoolId;
      req.subdomain = decoded.subdomain;
    }

    try {
      const Sentry = require('@sentry/node');
      Sentry.setUser({
        id: decoded.userId,
        email: decoded.email,
        schoolId: decoded.schoolId,
        role: Array.isArray(decoded.roles) ? decoded.roles.join(',') : decoded.role,
      });
    } catch (_e) { _e; }

    if (req.school?.school_id && decoded.schoolId && req.school.school_id !== decoded.schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot access another school\'s data.',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

module.exports = authMiddleware;
