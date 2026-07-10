/**
 * Attendance Routes
 */

const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { recordAttendanceValidator, bulkAttendanceValidator } = require('../validators/attendance.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  recordAttendanceValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'attendance'),
  attendanceController.recordAttendance
);

router.get('/', authMiddleware, attendanceController.getAllAttendance);

router.get('/student/:studentId', authMiddleware, attendanceController.getStudentAttendance);

router.get('/class/:classId/date/:date', authMiddleware, attendanceController.getClassAttendance);

router.get('/class/:classId', authMiddleware, attendanceController.getClassAttendanceNoDate);

router.get('/statistics', authMiddleware, attendanceController.getAttendanceStats);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  auditMiddleware('UPDATE', 'attendance'),
  attendanceController.updateAttendance
);

router.post(
  '/bulk',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  bulkAttendanceValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('BULK_CREATE', 'attendance'),
  attendanceController.bulkRecordAttendance
);

router.post(
  '/bulk-record',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  bulkAttendanceValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('BULK_CREATE', 'attendance'),
  attendanceController.bulkRecordAttendance
);

/**
 * @openapi
 * /api/attendance:
 *   post:
 *     tags: [Attendance]
 *     summary: Record attendance for a student
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, date, status]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, excused]
 *               remark:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance recorded
 *
 *   get:
 *     tags: [Attendance]
 *     summary: List all attendance records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       200:
 *         description: List of attendance records
 *
 * /api/attendance/student/{studentId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance for a student
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
 *         description: Student attendance records
 *
 * /api/attendance/class/{classId}/date/{date}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance for a class on a specific date
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
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Class attendance
 *
 * /api/attendance/class/{classId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance for a class (no date filter)
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
 *         description: Class attendance
 *
 * /api/attendance/statistics:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance statistics
 *
 * /api/attendance/{id}:
 *   put:
 *     tags: [Attendance]
 *     summary: Update an attendance record
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
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, excused]
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance updated
 *
 * /api/attendance/bulk:
 *   post:
 *     tags: [Attendance]
 *     summary: Bulk record attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, date, records]
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [present, absent, late, excused]
 *     responses:
 *       201:
 *         description: Bulk attendance recorded
 *
 * /api/attendance/bulk-record:
 *   post:
 *     tags: [Attendance]
 *     summary: Bulk record attendance (alias)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, date, records]
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [present, absent, late, excused]
 *     responses:
 *       201:
 *         description: Bulk attendance recorded
 */
module.exports = router;
