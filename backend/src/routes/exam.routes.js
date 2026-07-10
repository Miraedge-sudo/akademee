const express = require('express');
const examController = require('../controllers/exam.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { createExamValidator, updateExamValidator } = require('../validators/exam.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', examController.list);
router.post(
  '/',
  roleMiddleware(['admin']),
  createExamValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'exams'),
  examController.create
);
router.get('/:id', examController.getById);
router.put(
  '/:id',
  roleMiddleware(['admin']),
  updateExamValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'exams'),
  examController.update
);
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'exams'),
  examController.delete
);
router.post(
  '/:examId/register',
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('REGISTER', 'exam_registrations'),
  examController.registerStudent
);
router.get('/:examId/registrations', examController.listRegistrations);
router.put(
  '/registrations/:id/result',
  roleMiddleware(['admin', 'teacher']),
  auditMiddleware('RECORD_RESULT', 'exam_registrations'),
  examController.recordResult
);

/**
 * @openapi
 * /api/exams:
 *   get:
 *     tags: [Exams]
 *     summary: List all exams
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exams
 *
 *   post:
 *     tags: [Exams]
 *     summary: Create a new exam
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, subjectId, date]
 *             properties:
 *               name:
 *                 type: string
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               maxScore:
 *                 type: number
 *               coefficient:
 *                 type: number
 *     responses:
 *       201:
 *         description: Exam created
 *
 * /api/exams/{id}:
 *   get:
 *     tags: [Exams]
 *     summary: Get an exam by ID
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
 *         description: Exam details
 *
 *   put:
 *     tags: [Exams]
 *     summary: Update an exam
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
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               maxScore:
 *                 type: number
 *               coefficient:
 *                 type: number
 *     responses:
 *       200:
 *         description: Exam updated
 *
 *   delete:
 *     tags: [Exams]
 *     summary: Delete an exam
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
 *         description: Exam deleted
 *
 * /api/exams/{examId}/register:
 *   post:
 *     tags: [Exams]
 *     summary: Register a student for an exam
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
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
 *             required: [studentId]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Student registered
 *
 * /api/exams/{examId}/registrations:
 *   get:
 *     tags: [Exams]
 *     summary: List registrations for an exam
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of registrations
 *
 * /api/exams/registrations/{id}/result:
 *   put:
 *     tags: [Exams]
 *     summary: Record result for a registration
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
 *             required: [score]
 *             properties:
 *               score:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Result recorded
 */
module.exports = router;
