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

/**
 * @openapi
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Initiate a payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, amount, feeId]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               feeId:
 *                 type: string
 *                 format: uuid
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment initiated
 *
 *   get:
 *     tags: [Payments]
 *     summary: List school payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of payments
 *
 * /api/payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get a payment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment details
 *
 * /api/payments/student/{studentId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payments for a student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student payments
 *
 * /api/payments/confirm:
 *   post:
 *     tags: [Payments]
 *     summary: Confirm a payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId, transactionRef]
 *             properties:
 *               paymentId:
 *                 type: string
 *                 format: uuid
 *               transactionRef:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [successful, failed]
 *     responses:
 *       200:
 *         description: Payment confirmed
 *
 * /api/payments/report/generate:
 *   get:
 *     tags: [Payments]
 *     summary: Generate payment report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment report generated
 */
module.exports = router;
