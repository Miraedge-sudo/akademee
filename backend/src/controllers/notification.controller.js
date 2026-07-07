const response = require('../utils/response');
const notificationService = require('../services/notification.service');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { user } = req;
      const { limit = 20, offset = 0 } = req.query;
      const result = await notificationService.listByUser(user.userId, user.schoolId, { limit, offset });
      response.success(res, 'Notifications retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const result = await notificationService.markAsRead(userId, id);
      response.success(res, 'Notification marked as read', result);
    } catch (error) {
      if (error.message === 'Notification not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const result = await notificationService.delete(userId, id);
      response.success(res, 'Notification deleted', result);
    } catch (error) {
      if (error.message === 'Notification not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const { user } = req;
      const result = await notificationService.getUnreadCount(user.userId, user.schoolId);
      response.success(res, 'Unread count retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async sendNotification(req, res, next) {
    try {
      const { userId, title, message, type } = req.body;
      const { schoolId } = req;
      const result = await notificationService.send(schoolId, { userId, title, message, type });
      response.success(res, 'Notification sent', result, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
