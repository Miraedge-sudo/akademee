/**
 * School Validators
 */

const { body, param } = require('express-validator');

const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_PLANS = ['free', 'basic', 'premium'];

const registerSchoolValidator = [
  body('schoolName')
    .trim()
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ max: 200 })
    .withMessage('School name must be at most 200 characters'),
  body('subdomain')
    .trim()
    .notEmpty()
    .withMessage('Subdomain is required')
    .isLength({ min: 3, max: 63 })
    .withMessage('Subdomain must be between 3 and 63 characters')
    .customSanitizer((value) => value.toLowerCase())
    .matches(SUBDOMAIN_PATTERN)
    .withMessage('Subdomain may only contain lowercase letters, numbers, and hyphens'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('region')
    .optional({ values: 'falsy' })
    .trim(),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('School email is required')
    .isEmail()
    .withMessage('School email must be valid')
    .normalizeEmail(),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('adminEmail')
    .trim()
    .notEmpty()
    .withMessage('Admin email is required')
    .isEmail()
    .withMessage('Admin email must be valid')
    .normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('planId')
    .trim()
    .notEmpty()
    .withMessage('Plan is required')
    .isIn(VALID_PLANS)
    .withMessage('Plan must be one of: free, basic, premium'),
  body('templateCode')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['bold', 'playful', 'premium'])
    .withMessage('Template must be bold, playful, or premium'),
];

const checkSubdomainValidator = [
  body('subdomain')
    .trim()
    .notEmpty()
    .withMessage('Subdomain is required')
    .isLength({ min: 3, max: 63 })
    .withMessage('Subdomain must be between 3 and 63 characters')
    .customSanitizer((value) => value.toLowerCase())
    .matches(SUBDOMAIN_PATTERN)
    .withMessage('Subdomain may only contain lowercase letters, numbers, and hyphens'),
];

const createSchoolValidator = [
  body('name').trim().notEmpty().withMessage('School name is required'),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('city').optional().trim(),
  body('country').optional().trim(),
];

const updateSchoolValidator = [
  param('id').isUUID(),
  body('name').optional().trim(),
  body('email').optional().isEmail(),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('city').optional().trim(),
  body('region').optional().trim(),
  body('tagline').optional().trim(),
  body('address').optional().trim(),
  body('primary_color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Primary color must be a valid hex color'),
  body('website_description').optional().trim(),
  body('year_founded').optional().matches(/^\d{4}$/).withMessage('Year founded must be a 4-digit year'),
];

const getSchoolValidator = [
  param('id').isUUID().withMessage('School ID must be a valid UUID'),
];

module.exports = {
  registerSchoolValidator,
  checkSubdomainValidator,
  createSchoolValidator,
  updateSchoolValidator,
  getSchoolValidator,
};
