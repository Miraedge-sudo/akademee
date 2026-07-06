const express = require('express');
const feeCalculationController = require('../controllers/feeCalculation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();
router.use(authMiddleware);

router.post('/recalculate', roleMiddleware(['admin']), feeCalculationController.updateAllStatuses);
router.get('/student/:studentId', feeCalculationController.getStudentFeeStatus);
router.get('/student/:studentId/summary', feeCalculationController.getStudentFeeSummary);

/**
 * @openapi
 * /api/fee-calculations/recalculate:
 *   post:
 *     tags: [Finance]
 *     summary: Recalculate fee statuses for all students
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fee statuses recalculated
 *
 * /api/fee-calculations/student/{studentId}:
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
 * /api/fee-calculations/student/{studentId}/summary:
 *   get:
 *     tags: [Finance]
 *     summary: Get fee summary for a student
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
 *         description: Student fee summary
 */
module.exports = router;
