const express = require('express');
const { roleCheck } = require('../middleware/roleCheck');
const syncController = require('../controllers/sync.controller');

const router = express.Router();

// GET /api/sync-queue - List sync queue items
router.get('/', syncController.list);

// GET /api/sync-queue/status/:status - Get items by status
router.get('/status/:status', syncController.getByStatus);

// GET /api/sync-queue/failed-items - Get failed sync items that can be retried
router.get('/failed-items', syncController.getFailedItems);

// POST /api/sync-queue/:id/synced - Mark item as synced
router.post('/:id/synced', syncController.markSynced);

// POST /api/sync-queue/:id/failed - Mark item as failed
router.post('/:id/failed', syncController.markFailed);

// POST /api/sync-queue/:id/retry - Retry failed sync (SUPER_ADMIN, ADMIN)
router.post('/:id/retry', roleCheck(['SUPER_ADMIN', 'ADMIN']), syncController.retry);

module.exports = router;
