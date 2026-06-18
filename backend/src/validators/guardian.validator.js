/**
 * Guardian Validators
 */

const { body, param } = require('express-validator');

const createGuardianValidator = [
  body('studentId').isUUID().withMessage('Valid studentId is required'),
  body('name').optional().trim(),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('relationship').optional().isIn(['father', 'mother', 'guardian', 'other']),
  body('phone').optional().trim(),
  body('email').optional({ values: 'falsy' }).isEmail(),
];

const updateGuardianValidator = [
  param('id').isUUID(),
  body('name').optional().trim(),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('relationship').optional().isIn(['father', 'mother', 'guardian', 'other']),
  body('phone').optional().trim(),
  body('email').optional({ values: 'falsy' }).isEmail(),
];

module.exports = {
  createGuardianValidator,
  updateGuardianValidator,
};
