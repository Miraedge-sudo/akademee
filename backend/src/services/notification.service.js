const sql = require('../config/database');

class NotificationService {
  formatNotification(row) {
    return {
      id: row.notification_id,
      schoolId: row.school_id,
      userId: row.user_id,
      type: row.type,
      message: row.message,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }

  async listByUser(userId, schoolId, { limit = 20, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 200);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId} AND school_id = ${schoolId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM notifications
      WHERE user_id = ${userId} AND school_id = ${schoolId}
    `;

    return {
      notifications: rows.map(r => this.formatNotification(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async markAsRead(userId, notificationId) {
    const rows = await sql`
      UPDATE notifications SET is_read = true
      WHERE notification_id = ${notificationId} AND user_id = ${userId}
      RETURNING *
    `;
    if (rows.length === 0) throw new Error('Notification not found');
    return this.formatNotification(rows[0]);
  }

  async delete(userId, notificationId) {
    const rows = await sql`
      DELETE FROM notifications WHERE notification_id = ${notificationId} AND user_id = ${userId}
      RETURNING notification_id
    `;
    if (rows.length === 0) throw new Error('Notification not found');
    return { deleted: true, notificationId };
  }

  async getUnreadCount(userId, schoolId) {
    const rows = await sql`
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE user_id = ${userId} AND school_id = ${schoolId} AND is_read = false
    `;
    return { count: rows[0].count };
  }

  async send(schoolId, data) {
    const { userId, title, message, type } = data;
    const rows = await sql`
      INSERT INTO notifications (school_id, user_id, type, message)
      VALUES (${schoolId}, ${userId}, ${type || 'system'}, ${message})
      RETURNING *
    `;
    return this.formatNotification(rows[0]);
  }
}

module.exports = new NotificationService();
