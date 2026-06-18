/**
 * Authentication Middleware - Verify JWT Token
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization required.',
      });
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;

    if (decoded.schoolId) {
      req.schoolId = decoded.schoolId;
      req.tenantId = decoded.schoolId;
    }

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
