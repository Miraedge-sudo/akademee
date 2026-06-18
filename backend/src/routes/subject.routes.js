/**
 * Subject Routes
 */

const express = require('express');
const subjectController = require('../controllers/subject.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  subjectController.createSubject
);

router.get('/:id', authMiddleware, subjectController.getSubject);

router.get('/class/:classId', authMiddleware, subjectController.getClassSubjects);

router.put('/:id', authMiddleware, roleMiddleware(['admin']), subjectController.updateSubject);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), subjectController.deleteSubject);

module.exports = router;
