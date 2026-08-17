const sql = require('../config/database');

class NotificationService {
  formatNotification(row) {
    return {
      id: row.notification_id,
      schoolId: row.school_id,
      userId: row.user_id,
      type: row.type,
      message: row.message,
      messageEn: row.message_en || null,
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

  /**
   * Résout les destinataires selon l'audience demandée :
   *  - 'user'  → un utilisateur précis (userId)
   *  - 'all'   → tous les utilisateurs actifs de l'école
   *  - 'role'  → tous les utilisateurs ayant ce rôle (role_code)
   *  - 'class' → les élèves inscrits dans la classe + leurs tuteurs (parents)
   */
  async _resolveRecipients(schoolId, { audience = 'user', userId, role, classId }) {
    if (audience === 'user') {
      if (!userId) return [];
      const rows = await sql`
        SELECT user_id FROM users WHERE user_id = ${userId} AND school_id = ${schoolId}
      `;
      return rows.map((r) => r.user_id);
    }

    if (audience === 'all') {
      const rows = await sql`
        SELECT user_id FROM users WHERE school_id = ${schoolId} AND is_active = true
      `;
      return rows.map((r) => r.user_id);
    }

    if (audience === 'role') {
      if (!role) return [];
      const rows = await sql`
        SELECT DISTINCT u.user_id
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.user_id
        JOIN roles r ON r.role_id = ur.role_id
        WHERE u.school_id = ${schoolId} AND UPPER(r.role_code) = UPPER(${role})
      `;
      return rows.map((r) => r.user_id);
    }

    if (audience === 'class') {
      if (!classId) return [];
      const rows = await sql`
        SELECT DISTINCT st.user_id AS uid
        FROM enrollments e
        JOIN students st ON st.student_id = e.student_id
        WHERE e.class_id = ${classId} AND e.school_id = ${schoolId} AND st.user_id IS NOT NULL
        UNION
        SELECT DISTINCT g.user_id AS uid
        FROM enrollments e
        JOIN students st ON st.student_id = e.student_id
        JOIN guardians g ON g.student_id = st.student_id
        WHERE e.class_id = ${classId} AND e.school_id = ${schoolId} AND g.user_id IS NOT NULL
      `;
      return rows.map((r) => r.uid);
    }

    return [];
  }

  /**
   * Envoie une notification à une audience (user | all | role | class).
   * Insère une ligne par destinataire en un seul INSERT bulk.
   * Retourne { sent, recipients }.
   */
  async sendBroadcast(schoolId, { audience = 'user', userId, role, classId, message, messageEn = null, type }) {
    const recipients = await this._resolveRecipients(schoolId, { audience, userId, role, classId });
    if (recipients.length === 0) {
      return { sent: 0, recipients: [] };
    }

    const rows = recipients.map((uid) => [schoolId, uid, type || 'system', message, messageEn]);
    await sql`
      INSERT INTO notifications (school_id, user_id, type, message, message_en)
      VALUES ${sql(rows)}
    `;
    return { sent: recipients.length, recipients };
  }
}

module.exports = new NotificationService();
