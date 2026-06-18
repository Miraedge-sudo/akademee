/**
 * Notification Routes
 */

const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.get('/', authMiddleware, notificationController.getNotifications);

router.put('/:id/read', authMiddleware, notificationController.markAsRead);

router.delete('/:id', authMiddleware, notificationController.deleteNotification);

router.get('/unread/count', authMiddleware, notificationController.getUnreadCount);

router.post(
  '/send',
  authMiddleware,
  roleMiddleware(['admin']),
  notificationController.sendNotification
);

module.exports = router;
