const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/stats', authMiddleware, dashboardController.getStats);

router.get('/activities', authMiddleware, dashboardController.getRecentActivities);

router.get('/revenue', authMiddleware, dashboardController.getRevenueData);

router.get('/finance-stats', authMiddleware, dashboardController.getFinanceStats);

/**
 * @openapi
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *
 * /api/dashboard/activities:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent activities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activities
 *
 * /api/dashboard/revenue:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get revenue data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue data
 */
module.exports = router;
