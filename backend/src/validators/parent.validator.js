/**
 * Parent Portal Validators
 */

const { body, param } = require('express-validator');

const payFeeValidator = [
  body('studentId').notEmpty(),
  body('feeId').notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('method').optional().isString(),
  body('academicYearId').optional(),
  body('reference').optional(),
];

const sendMessageValidator = [
  body('subject').notEmpty(),
  body('message').notEmpty(),
  body('studentId').optional(),
];

const replyValidator = [
  body('message').notEmpty(),
];

const updateStatusValidator = [
  body('status').isIn(['open', 'in_progress', 'resolved']),
];

module.exports = {
  payFeeValidator,
  sendMessageValidator,
  replyValidator,
  updateStatusValidator,
};
