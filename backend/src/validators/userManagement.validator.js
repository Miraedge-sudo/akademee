const { body } = require('express-validator');

const createUserValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('roleCode').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('gender').optional().trim(),
  body('dob').optional().trim(),
  body('nationality').optional().trim(),
  body('className').optional().trim(),
  body('guardianName').optional().trim(),
  body('guardianPhone').optional().trim(),
  body('feeAmount').optional(),
  body('avatarUrl').optional().isString().withMessage('avatarUrl must be a string'),
];

const updateUserValidator = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('avatarUrl').optional().isString().withMessage('avatarUrl must be a string'),
];

module.exports = { createUserValidator, updateUserValidator };
