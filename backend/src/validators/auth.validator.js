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

const verifySchoolValidator = [
  body('subdomain')
    .trim()
    .notEmpty()
    .withMessage('Subdomain is required')
    .customSanitizer((value) => value.toLowerCase())
    .matches(SUBDOMAIN_PATTERN)
    .withMessage('Subdomain may only contain lowercase letters, numbers, and hyphens'),
];

const forgotPasswordValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subdomain')
    .trim()
    .notEmpty()
    .withMessage('Subdomain is required')
    .customSanitizer((value) => value.toLowerCase())
    .matches(SUBDOMAIN_PATTERN)
    .withMessage('Invalid subdomain format'),
];

const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

module.exports = {
  registerValidator,
  loginValidator,
  verifySchoolValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
