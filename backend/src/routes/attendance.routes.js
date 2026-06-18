/**
 * Attendance Routes
 */

const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  attendanceController.recordAttendance
);

router.get('/student/:studentId', authMiddleware, attendanceController.getStudentAttendance);

router.get('/class/:classId/date/:date', authMiddleware, attendanceController.getClassAttendance);

router.put('/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), attendanceController.updateAttendance);

router.post(
  '/bulk-record',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  attendanceController.bulkRecordAttendance
);

module.exports = router;
