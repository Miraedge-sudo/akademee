/**
 * Report Routes
 */

const express = require('express');
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.get('/bulletin/:studentId/:periodId', authMiddleware, reportController.generateBulletin);

router.get('/class/:classId/:periodId', authMiddleware, roleMiddleware(['admin', 'teacher']), reportController.generateClassReport);

router.get('/performance/:studentId', authMiddleware, reportController.getStudentPerformance);

router.get('/export/:reportId', authMiddleware, reportController.exportReport);

module.exports = router;
