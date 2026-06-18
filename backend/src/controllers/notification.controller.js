/**
 * Notification Controller
 */

const response = require('../utils/response');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { user } = req;
      const { limit = 20, offset = 0 } = req.query;

      response.success(res, 'Notifications retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Notification marked as read', {});
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Notification deleted');
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const { user } = req;

      response.success(res, 'Unread count retrieved', { count: 0 });
    } catch (error) {
      next(error);
    }
  }

  async sendNotification(req, res, next) {
    try {
      const { userId, title, message, type } = req.body;

      response.success(res, 'Notification sent', {}, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
