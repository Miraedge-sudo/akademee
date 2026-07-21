const express = require('express');
const feeController = require('../controllers/fee.controller');
const feeCalculationController = require('../controllers/feeCalculation.controller');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { createFeeValidator, updateFeeValidator, assignFeesValidator } = require('../validators/fee.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post(
  '/fees',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  createFeeValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'fees'),
  feeController.createFeeStructure
);

router.get('/fees', authMiddleware, tenantMiddleware, feeController.getSchoolFees);

router.get('/fees/:id', authMiddleware, feeController.getFeeStructure);

router.put(
  '/fees/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  updateFeeValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'fees'),
  feeController.updateFeeStructure
);

router.delete(
  '/fees/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'fees'),
  feeController.deleteFeeStructure
);

router.post(
  '/fees/assign',
  authMiddleware,
  roleMiddleware(['admin']),
  assignFeesValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('ASSIGN', 'student_fees'),
  feeController.assignFeesToClass
);

router.get('/student/:studentId', authMiddleware, feeCalculationController.getStudentFeeStatus);

router.get('/reports', authMiddleware, paymentController.generatePaymentReport);

/**
 * @openapi
 * /api/finance/fees:
 *   post:
 *     tags: [Finance]
 *     summary: Create a fee structure
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, amount]
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Fee structure created
 *
 *   get:
 *     tags: [Finance]
 *     summary: List fee structures
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of fee structures
 *
 * /api/finance/fees/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get a fee structure by ID
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
 *         description: Fee structure details
 *
 *   put:
 *     tags: [Finance]
 *     summary: Update a fee structure
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Fee structure updated
 *
 *   delete:
 *     tags: [Finance]
 *     summary: Delete a fee structure
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
 *         description: Fee structure deleted
 *
 * /api/finance/fees/assign:
 *   post:
 *     tags: [Finance]
 *     summary: Assign fees to a class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feeId, classId]
 *             properties:
 *               feeId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Fees assigned
 *
 * /api/finance/student/{studentId}:
 *   get:
 *     tags: [Finance]
 *     summary: Get fee status for a student
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
 *         description: Student fee status
 *
 * /api/finance/reports:
 *   get:
 *     tags: [Finance]
 *     summary: Generate payment reports
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
 *         description: Payment report
 */
module.exports = router;
