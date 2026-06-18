/**
 * Student Validators
 */

const { body, param } = require('express-validator');

const createStudentValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').optional({ values: 'falsy' }).isEmail(),
  body('phone').optional({ values: 'falsy' }).trim(),
  body('className').trim().notEmpty().withMessage('Class is required'),
  body('classId').optional({ values: 'falsy' }).isUUID(),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('studentNumber').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'graduated', 'transferred', 'suspended']),
  body('feeStatus').optional().isIn(['pending', 'partial', 'paid', 'overdue', 'unpaid']),
];

const updateStudentValidator = [
  param('id').isUUID(),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('email').optional({ values: 'falsy' }).isEmail(),
  body('phone').optional({ values: 'falsy' }).trim(),
  body('className').optional().trim(),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('status').optional().isIn(['active', 'inactive', 'graduated', 'transferred', 'suspended']),
  body('feeStatus').optional().isIn(['pending', 'partial', 'paid', 'overdue', 'unpaid']),
];

module.exports = {
  createStudentValidator,
  updateStudentValidator,
};
