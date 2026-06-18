/**
 * Class Routes
 */

const express = require('express');
const classController = require('../controllers/class.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  classController.createClass
);

router.get('/:id', authMiddleware, classController.getClass);

router.get('/', authMiddleware, tenantMiddleware, classController.getSchoolClasses);

router.put('/:id', authMiddleware, roleMiddleware(['admin']), classController.updateClass);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), classController.deleteClass);

module.exports = router;
