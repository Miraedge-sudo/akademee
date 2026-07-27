const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { refreshStatuses } = require('../services/scheduler.service');
const response = require('../utils/response');

/**
 * PATCH /api/admin/refresh-period-statuses
 * Manually trigger the status refresh for all periods and sequences.
 * Admin only.
 */
router.patch(
  '/refresh-period-statuses',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res, next) => {
    try {
      const result = await refreshStatuses();
      response.success(res, 'Statuses refreshed', result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
