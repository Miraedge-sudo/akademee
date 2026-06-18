/**
 * Payment Routes
 */

const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const { initiatePaymentValidator, confirmPaymentValidator } = require('../validators/payment.validator');
const validateMiddleware = require('../middleware/validate.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  initiatePaymentValidator,
  validateMiddleware,
  paymentController.initiatePayment
);

router.get('/:id', authMiddleware, paymentController.getPayment);

router.get('/student/:studentId', authMiddleware, paymentController.getStudentPayments);

router.get('/', authMiddleware, tenantMiddleware, paymentController.getSchoolPayments);

router.post(
  '/confirm',
  authMiddleware,
  confirmPaymentValidator,
  validateMiddleware,
  paymentController.confirmPayment
);

router.get('/report/generate', authMiddleware, roleMiddleware(['admin']), paymentController.generatePaymentReport);

module.exports = router;
