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

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *
 * /api/notifications/unread/count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *
 * /api/notifications/send:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, message]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification sent
 *
 * /api/notifications/{id}:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notification marked as read
 *
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted
 */
module.exports = router;
