/**
 * Authentication Routes
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { loginValidator, verifySchoolValidator, forgotPasswordValidator, resetPasswordValidator } = require('../validators/auth.validator');
const validateMiddleware = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifySchoolLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, loginValidator, validateMiddleware, authController.login);
router.post('/verify-school', verifySchoolLimiter, verifySchoolValidator, validateMiddleware, authController.verifySchool);

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password reset requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many reset attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, validateMiddleware, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidator, validateMiddleware, authController.resetPassword);

router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
