const express = require('express');
const gradeCalculationController = require('../controllers/gradeCalculation.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/averages/:studentId', gradeCalculationController.calculateAverages);
router.get('/rankings/:classId', gradeCalculationController.calculateClassRankings);

/**
 * @openapi
 * /api/grade-calculations/averages/{studentId}:
 *   get:
 *     tags: [Grades]
 *     summary: Calculate grade averages for a student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: periodId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Grade averages calculated
 *
 * /api/grade-calculations/rankings/{classId}:
 *   get:
 *     tags: [Grades]
 *     summary: Calculate class rankings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: periodId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Class rankings calculated
 */
module.exports = router;
