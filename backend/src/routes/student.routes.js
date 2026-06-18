/**
 * Student Routes — all endpoints require auth + tenant; data isolated by school_id.
 */

const express = require('express');
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { createStudentValidator, updateStudentValidator } = require('../validators/student.validator');
const validateMiddleware = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post(
  '/',
  roleMiddleware(['admin', 'teacher']),
  createStudentValidator,
  validateMiddleware,
  studentController.createStudent
);

router.get(
  '/',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  studentController.getAllStudents
);

router.get(
  '/:id',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  studentController.getStudent
);

router.put(
  '/:id',
  roleMiddleware(['admin', 'teacher']),
  updateStudentValidator,
  validateMiddleware,
  studentController.updateStudent
);

router.delete(
  '/:id',
  roleMiddleware(['admin']),
  studentController.deleteStudent
);

module.exports = router;
