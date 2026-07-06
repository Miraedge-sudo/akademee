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
const gradeCalculationController = require('../controllers/gradeCalculation.controller');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  recordGradeValidator,
  validateMiddleware,
  gradeController.recordGrade
);

router.get('/', authMiddleware, gradeController.getAllGrades);

router.get('/student/:studentId', authMiddleware, gradeController.getStudentGrades);

router.get('/class/:classId', authMiddleware, gradeController.getClassGrades);

router.get('/period/:periodId/class/:classId', authMiddleware, gradeController.getPeriodGrades);

router.post('/calculate', authMiddleware, roleMiddleware(['admin']), gradeCalculationController.calculate);

router.get('/report/:studentId', authMiddleware, gradeController.getReportCard);

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

/**
 * @openapi
 * /api/grades:
 *   post:
 *     tags: [Grades]
 *     summary: Record a grade
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, subjectId, score]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               score:
 *                 type: number
 *               maxScore:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Grade recorded
 *
 *   get:
 *     tags: [Grades]
 *     summary: List all grades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: subjectId
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
 *         description: List of grades
 *
 * /api/grades/student/{studentId}:
 *   get:
 *     tags: [Grades]
 *     summary: Get grades for a student
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
 *         description: Student grades
 *
 * /api/grades/class/{classId}:
 *   get:
 *     tags: [Grades]
 *     summary: Get grades for a class
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
 *         description: Class grades
 *
 * /api/grades/period/{periodId}/class/{classId}:
 *   get:
 *     tags: [Grades]
 *     summary: Get grades for a period and class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Period grades
 *
 * /api/grades/calculate:
 *   post:
 *     tags: [Grades]
 *     summary: Calculate grade calculations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grade calculations completed
 *
 * /api/grades/report/{studentId}:
 *   get:
 *     tags: [Grades]
 *     summary: Get report card for a student
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
 *         description: Report card
 *
 * /api/grades/{id}:
 *   put:
 *     tags: [Grades]
 *     summary: Update a grade
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
 *               score:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Grade updated
 *
 *   delete:
 *     tags: [Grades]
 *     summary: Delete a grade
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
 *         description: Grade deleted
 *
 * /api/grades/bulk-upload:
 *   post:
 *     tags: [Grades]
 *     summary: Bulk upload grades via file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Grades uploaded
 */
module.exports = router;
