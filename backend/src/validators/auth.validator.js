/**
 * Authentication Validators
 */

const { body } = require('express-validator');

const registerValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('schoolName').trim().notEmpty(),
];

const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const loginValidator = [
  body('subdomain')
    .trim()
    .notEmpty()
    .withMessage('Subdomain is required')
    .customSanitizer((value) => value.toLowerCase())
    .matches(SUBDOMAIN_PATTERN)
    .withMessage('Subdomain may only contain lowercase letters, numbers, and hyphens'),
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty(),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
};
