/**
 * Guardian Routes — all endpoints require auth + tenant (school isolation).
 */

const express = require('express');
const guardianController = require('../controllers/guardian.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const { createGuardianValidator, updateGuardianValidator } = require('../validators/guardian.validator');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post(
  '/',
  roleMiddleware(['admin', 'teacher']),
  createGuardianValidator,
  validateMiddleware,
  guardianController.createGuardian
);

router.get(
  '/student/:studentId',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  guardianController.getStudentGuardians
);

router.get(
  '/:id',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  guardianController.getGuardian
);

router.put(
  '/:id',
  roleMiddleware(['admin', 'teacher']),
  updateGuardianValidator,
  validateMiddleware,
  guardianController.updateGuardian
);

router.delete(
  '/:id',
  roleMiddleware(['admin']),
  guardianController.deleteGuardian
);

module.exports = router;
