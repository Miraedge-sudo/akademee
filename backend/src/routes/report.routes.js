const express = require('express');
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.get('/bulletin/:studentId/:periodId', authMiddleware, reportController.generateBulletin);

router.get('/bulletin/:id', authMiddleware, reportController.generateBulletinSimple);

router.get('/bulletin/:studentId/:periodId/download', authMiddleware, reportController.downloadBulletin);

router.get('/bulletin/:id/download', authMiddleware, reportController.downloadBulletinSimple);

router.get('/class/:classId/:periodId', authMiddleware, roleMiddleware(['admin', 'teacher']), reportController.generateClassReport);

router.get('/class/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), reportController.generateClassReportSimple);

router.get('/performance/:studentId', authMiddleware, reportController.getStudentPerformance);

router.get('/export/:reportId', authMiddleware, reportController.exportReport);

/**
 * @openapi
 * /api/reports/bulletin/{studentId}/{periodId}:
 *   get:
 *     tags: [Reports]
 *     summary: Generate bulletin for a student and period
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bulletin generated
 *
 * /api/reports/bulletin/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Generate bulletin by ID
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
 *         description: Bulletin generated
 *
 * /api/reports/bulletin/{studentId}/{periodId}/download:
 *   get:
 *     tags: [Reports]
 *     summary: Download bulletin PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bulletin PDF downloaded
 *
 * /api/reports/bulletin/{id}/download:
 *   get:
 *     tags: [Reports]
 *     summary: Download bulletin PDF by ID
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
 *         description: Bulletin PDF downloaded
 *
 * /api/reports/class/{classId}/{periodId}:
 *   get:
 *     tags: [Reports]
 *     summary: Generate class report for a period
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Class report generated
 *
 * /api/reports/class/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Generate class report by ID
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
 *         description: Class report generated
 *
 * /api/reports/performance/{studentId}:
 *   get:
 *     tags: [Reports]
 *     summary: Get performance report for a student
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
 *         description: Student performance report
 *
 * /api/reports/export/{reportId}:
 *   get:
 *     tags: [Reports]
 *     summary: Export a report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Report exported
 */
module.exports = router;
