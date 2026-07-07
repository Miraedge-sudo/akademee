const express = require('express');
const attendanceStatsController = require('../controllers/attendanceStats.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/student/:studentId', attendanceStatsController.getStudentStats);
router.get('/class/:classId', attendanceStatsController.getClassStats);
router.get('/trends/monthly', attendanceStatsController.getMonthlyTrend);

/**
 * @openapi
 * /api/attendance-stats/student/{studentId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance statistics for a student
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
 *         description: Student attendance stats
 *
 * /api/attendance-stats/class/{classId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance statistics for a class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Class attendance stats
 *
 * /api/attendance-stats/trends/monthly:
 *   get:
 *     tags: [Attendance]
 *     summary: Get monthly attendance trends
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly attendance trends
 */
module.exports = router;
