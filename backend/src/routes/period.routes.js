const express = require('express');
const periodController = require('../controllers/period.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { createPeriodValidator, updatePeriodValidator } = require('../validators/period.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', periodController.list);
router.post(
  '/',
  roleMiddleware(['admin']),
  createPeriodValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'periods'),
  periodController.create
);
router.get('/:id', periodController.getById);
router.put(
  '/:id',
  roleMiddleware(['admin']),
  updatePeriodValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'periods'),
  periodController.update
);
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'periods'),
  periodController.delete
);

/**
 * @openapi
 * /api/periods:
 *   get:
 *     tags: [Periods]
 *     summary: List all periods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of periods
 *
 *   post:
 *     tags: [Periods]
 *     summary: Create a new period
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, academicYearId, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Period created
 *
 * /api/periods/{id}:
 *   get:
 *     tags: [Periods]
 *     summary: Get a period by ID
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
 *         description: Period details
 *
 *   put:
 *     tags: [Periods]
 *     summary: Update a period
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
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Period updated
 *
 *   delete:
 *     tags: [Periods]
 *     summary: Delete a period
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
 *         description: Period deleted
 */
module.exports = router;
