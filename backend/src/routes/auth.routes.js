/**
 * Authentication Routes
 */

const express = require('express');
const authController = require('../controllers/auth.controller');
const { registerValidator, loginValidator, refreshTokenValidator } = require('../validators/auth.validator');
const validateMiddleware = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', loginValidator, validateMiddleware, authController.login);
router.post('/verify-school', authController.verifySchool);

// Existing routes (if any)
// router.post('/register', registerValidator, validateMiddleware, authController.register);
// router.post('/refresh-token', refreshTokenValidator, validateMiddleware, authController.refreshToken);

// Protected routes (authentication required)
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);
// router.post('/verify-email', authController.verifyEmail);

module.exports = router;
