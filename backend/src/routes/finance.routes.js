/**
 * Finance Routes
 */

const express = require('express');
const feeController = require('../controllers/fee.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  feeController.createFeeStructure
);

router.get('/:id', authMiddleware, feeController.getFeeStructure);

router.get('/', authMiddleware, tenantMiddleware, feeController.getSchoolFees);

router.put('/:id', authMiddleware, roleMiddleware(['admin']), feeController.updateFeeStructure);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), feeController.deleteFeeStructure);

module.exports = router;
