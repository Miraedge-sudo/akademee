const express = require('express');
const { roleCheck } = require('../middleware/roleCheck');
const enrollmentController = require('../controllers/enrollment.controller');

const router = express.Router();

// GET /api/enrollments - List all enrollments
router.get('/', enrollmentController.list);

// GET /api/enrollments/:id - Get single enrollment
router.get('/:id', enrollmentController.get);

// POST /api/enrollments - Create new enrollment (SUPER_ADMIN, ADMIN)
router.post('/', roleCheck(['SUPER_ADMIN', 'ADMIN']), enrollmentController.create);

// PUT /api/enrollments/:id - Update enrollment (SUPER_ADMIN, ADMIN)
router.put('/:id', roleCheck(['SUPER_ADMIN', 'ADMIN']), enrollmentController.update);

// DELETE /api/enrollments/:id - Delete enrollment (SUPER_ADMIN only)
router.delete('/:id', roleCheck(['SUPER_ADMIN']), enrollmentController.remove);

module.exports = router;
