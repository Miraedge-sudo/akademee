/**
 * Campus Message Service — admin-side management of parent/campus threads.
 */

const sql = require('../config/database');

class CampusMessageService {
  formatMessage(row) {
    return {
      id: row.message_id,
      schoolId: row.school_id,
      userId: row.user_id,
      userEmail: row.user_email || null,
      senderName: row.sender_name || null,
      studentId: row.student_id,
      studentName: row.student_name || null,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdBy: row.created_by,
      replyCount: Number(row.reply_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  formatReply(row) {
    return {
      id: row.reply_id,
      messageId: row.message_id,
      userId: row.user_id,
      senderName: row.sender_name || null,
      isAdmin: Boolean(row.is_admin),
      message: row.message,
      createdAt: row.created_at,
    };
  }

  async listBySchool(schoolId, { limit = 50, offset = 0, status, studentId } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT
        m.*,
        u.email AS user_email,
        CONCAT(u.first_name, ' ', u.last_name) AS sender_name,
        CONCAT(stu.first_name, ' ', stu.last_name) AS student_name,
        (SELECT COUNT(*)::int FROM campus_message_replies r WHERE r.message_id = m.message_id) AS reply_count
      FROM campus_messages m
      LEFT JOIN users u ON m.user_id = u.user_id
      LEFT JOIN students st ON m.student_id = st.student_id
      LEFT JOIN users stu ON st.user_id = stu.user_id
      WHERE m.school_id = ${schoolId}
        ${status ? sql`AND m.status = ${status}` : sql``}
        ${studentId ? sql`AND m.student_id = ${studentId}` : sql``}
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM campus_messages m
      WHERE m.school_id = ${schoolId}
        ${status ? sql`AND m.status = ${status}` : sql``}
        ${studentId ? sql`AND m.student_id = ${studentId}` : sql``}
    `;

    return {
      messages: rows.map((r) => this.formatMessage(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async getThread(schoolId, messageId) {
    const messages = await sql`
      SELECT
        m.*,
        u.email AS user_email,
        CONCAT(u.first_name, ' ', u.last_name) AS sender_name,
        CONCAT(stu.first_name, ' ', stu.last_name) AS student_name,
        (SELECT COUNT(*)::int FROM campus_message_replies r WHERE r.message_id = m.message_id) AS reply_count
      FROM campus_messages m
      LEFT JOIN users u ON m.user_id = u.user_id
      LEFT JOIN students st ON m.student_id = st.student_id
      LEFT JOIN users stu ON st.user_id = stu.user_id
      WHERE m.message_id = ${messageId} AND m.school_id = ${schoolId}
    `;
    if (messages.length === 0) throw new Error('Message not found');

    const replies = await sql`
      SELECT r.*, CONCAT(sender.first_name, ' ', sender.last_name) AS sender_name
      FROM campus_message_replies r
      LEFT JOIN users sender ON r.user_id = sender.user_id
      WHERE r.message_id = ${messageId}
      ORDER BY r.created_at ASC
    `;

    return {
      ...this.formatMessage(messages[0]),
      replies: replies.map((r) => this.formatReply(r)),
    };
  }

  async adminReply(schoolId, adminUserId, messageId, data) {
    const { message } = data;
    if (!message || !message.trim()) throw new Error('Message is required');

    const existing = await sql`
      SELECT message_id FROM campus_messages WHERE message_id = ${messageId} AND school_id = ${schoolId}
    `;
    if (existing.length === 0) throw new Error('Message not found');

    const rows = await sql`
      INSERT INTO campus_message_replies (message_id, school_id, user_id, message, is_admin)
      VALUES (${messageId}, ${schoolId}, ${adminUserId}, ${message.trim()}, true)
      RETURNING *
    `;
    await sql`
      UPDATE campus_messages SET updated_at = NOW(), status = 'in_progress'
      WHERE message_id = ${messageId}
    `;
    return this.formatReply(rows[0]);
  }

  async updateStatus(schoolId, messageId, status) {
    const allowed = ['open', 'in_progress', 'resolved'];
    if (!allowed.includes(status)) throw new Error('Invalid status');

    const rows = await sql`
      UPDATE campus_messages SET status = ${status}, updated_at = NOW()
      WHERE message_id = ${messageId} AND school_id = ${schoolId}
      RETURNING *
    `;
    if (rows.length === 0) throw new Error('Message not found');
    return this.formatMessage(rows[0]);
  }
}

module.exports = new CampusMessageService();
