const express = require('express');
const { roleCheck } = require('../middleware/roleCheck');
const feeController = require('../controllers/fee.controller');

const router = express.Router();

// GET /api/fee-structures - List fee structures
router.get('/', feeController.list);

// GET /api/fee-structures/:id - Get single fee structure
router.get('/:id', feeController.get);

// POST /api/fee-structures - Create fee structure (SUPER_ADMIN, ADMIN, ACCOUNTANT)
router.post('/', roleCheck(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), feeController.create);

// PUT /api/fee-structures/:id - Update fee structure (SUPER_ADMIN, ADMIN, ACCOUNTANT)
router.put('/:id', roleCheck(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), feeController.update);

module.exports = router;
