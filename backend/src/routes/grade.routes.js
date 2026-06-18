/**
 * Grade Routes
 */

const express = require('express');
const gradeController = require('../controllers/grade.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');
const { recordGradeValidator, updateGradeValidator } = require('../validators/grade.validator');
const validateMiddleware = require('../middleware/validate.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  recordGradeValidator,
  validateMiddleware,
  gradeController.recordGrade
);

router.get('/student/:studentId', authMiddleware, gradeController.getStudentGrades);

router.get('/period/:periodId/class/:classId', authMiddleware, gradeController.getPeriodGrades);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  updateGradeValidator,
  validateMiddleware,
  gradeController.updateGrade
);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), gradeController.deleteGrade);

router.post(
  '/bulk-upload',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  uploadMiddleware,
  gradeController.bulkUploadGrades
);

module.exports = router;
