/**
 * Payment Validators
 */

const { body, param } = require('express-validator');

const initiatePaymentValidator = [
  body('studentId').notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('feeId').notEmpty(),
  body('reference').optional(),
];

const confirmPaymentValidator = [
  body('reference').notEmpty(),
];

const paymentReportValidator = [
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
];

module.exports = {
  initiatePaymentValidator,
  confirmPaymentValidator,
  paymentReportValidator,
};
