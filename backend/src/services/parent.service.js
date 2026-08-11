/**
 * Parent Service — portal endpoints for the PARENT role.
 * All data access is scoped to the parent's linked children (guardians table)
 * and to the school_id (tenant isolation).
 */

const sql = require('../config/database');
const guardianService = require('./guardian.service');
const paymentService = require('./payment.service');
const studentFeeService = require('./studentFee.service');
const feeCalculationService = require('./feeCalculation.service');

class ParentService {
  formatMessage(row) {
    return {
      id: row.message_id,
      schoolId: row.school_id,
      userId: row.user_id,
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

  /**
   * Assert the given student is one of the parent's children.
   */
  async assertChildOfParent(schoolId, userId, email, studentId) {
    const rows = await sql`
      SELECT g.guardian_id
      FROM guardians g
      WHERE g.school_id = ${schoolId}
        AND g.student_id = ${studentId}
        AND (
          (${userId ? sql`g.user_id = ${userId}` : sql`false`})
          OR (${userId ? sql`false` : sql`true`} AND LOWER(g.email) = LOWER(${email || ''}))
        )
      LIMIT 1
    `;
    if (rows.length === 0) {
      throw new Error('This student is not linked to your account');
    }
  }

  async getMyChildren(schoolId, { userId, email }) {
    return guardianService.getMyChildren(schoolId, { userId, email });
  }

  /**
   * Fee summary for each child (student_fees + totals).
   */
  async getMyFees(schoolId, userId, email, { academicYearId } = {}) {
    const children = await this.getMyChildren(schoolId, { userId, email });
    if (children.length === 0) return [];

    const studentIds = children.map((c) => c.id);

    const rows = await sql`
      SELECT
        sf.student_id,
        f.fee_id,
        f.name AS fee_name,
        sf.amount_due,
        sf.amount_paid,
        sf.status AS fee_status,
        f.due_date,
        sf.academic_year_id
      FROM student_fees sf
      JOIN fees f ON sf.fee_id = f.fee_id
      WHERE sf.school_id = ${schoolId}
        AND sf.student_id = ANY(${studentIds})
        ${academicYearId ? sql`AND sf.academic_year_id = ${academicYearId}` : sql``}
      ORDER BY f.name ASC
    `;

    const summaryRows = await sql`
      SELECT
        sf.student_id,
        COALESCE(SUM(sf.amount_due), 0)::numeric AS total_due,
        COALESCE(SUM(sf.amount_paid), 0)::numeric AS total_paid
      FROM student_fees sf
      WHERE sf.school_id = ${schoolId}
        AND sf.student_id = ANY(${studentIds})
        ${academicYearId ? sql`AND sf.academic_year_id = ${academicYearId}` : sql``}
      GROUP BY sf.student_id
    `;

    const summaryByStudent = {};
    for (const s of summaryRows) {
      const totalDue = Number(s.total_due);
      const totalPaid = Number(s.total_paid);
      summaryByStudent[s.student_id] = {
        totalDue,
        totalPaid,
        balance: totalDue - totalPaid,
        status: totalDue === 0 ? 'none' : totalPaid >= totalDue ? 'paid' : totalPaid > 0 ? 'partial' : 'pending',
      };
    }

    return children.map((child) => ({
      ...child,
      fees: rows
        .filter((r) => r.student_id === child.id)
        .map((r) => ({
          feeId: r.fee_id,
          feeName: r.fee_name,
          amountDue: Number(r.amount_due),
          amountPaid: Number(r.amount_paid),
          balance: Number(r.amount_due) - Number(r.amount_paid),
          status: r.fee_status,
          dueDate: r.due_date || null,
          academicYearId: r.academic_year_id,
        })),
      summary: summaryByStudent[child.id] || { totalDue: 0, totalPaid: 0, balance: 0, status: 'none' },
    }));
  }

  /**
   * Pay a fee for one of the parent's children.
   */
  async payFee(schoolId, userId, email, data) {
    const { studentId, feeId, amount, method, academicYearId, reference } = data;
    await this.assertChildOfParent(schoolId, userId, email, studentId);

    const payment = await paymentService.create(schoolId, { studentId, amount, method: method || 'cash', feeId, academicYearId, reference });

    await studentFeeService.updatePayment(schoolId, studentId, feeId, amount, academicYearId);

    const feeStatus = await feeCalculationService.calculateStudentFeeStatus(schoolId, studentId);
    await sql`
      UPDATE students
      SET fee_status = ${feeStatus.status}
      WHERE student_id = ${studentId} AND school_id = ${schoolId}
    `;

    return payment;
  }

  /**
   * Payment history for all children.
   */
  async getMyPayments(schoolId, userId, email, { academicYearId } = {}) {
    const children = await this.getMyChildren(schoolId, { userId, email });
    if (children.length === 0) return [];

    const studentIds = children.map((c) => c.id);

    const rows = await sql`
      SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name, f.name AS fee_name
      FROM payments p
      LEFT JOIN students st ON p.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      LEFT JOIN fees f ON p.fee_id = f.fee_id
      WHERE p.school_id = ${schoolId}
        AND p.student_id = ANY(${studentIds})
        ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      ORDER BY p.created_at DESC
    `;

    return rows.map((r) => ({
      id: r.payment_id,
      studentId: r.student_id,
      studentName: r.student_name,
      amount: Number(r.amount),
      method: r.method,
      status: r.status,
      reference: r.receipt_number,
      feeId: r.fee_id,
      feeName: r.fee_name || null,
      academicYearId: r.academic_year_id,
      createdAt: r.created_at,
    }));
  }

  /**
   * Messages sent by this parent to the campus.
   */
  async getMyMessages(schoolId, userId) {
    const rows = await sql`
      SELECT
        m.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        (SELECT COUNT(*)::int FROM campus_message_replies r WHERE r.message_id = m.message_id) AS reply_count
      FROM campus_messages m
      LEFT JOIN students st ON m.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE m.school_id = ${schoolId} AND m.user_id = ${userId}
      ORDER BY m.created_at DESC
    `;
    return rows.map((r) => this.formatMessage(r));
  }

  /**
   * A single message thread (message + replies), owner only.
   */
  async getMessageThread(schoolId, userId, messageId) {
    const messages = await sql`
      SELECT
        m.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        (SELECT COUNT(*)::int FROM campus_message_replies r WHERE r.message_id = m.message_id) AS reply_count
      FROM campus_messages m
      LEFT JOIN students st ON m.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE m.message_id = ${messageId} AND m.school_id = ${schoolId} AND m.user_id = ${userId}
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

  /**
   * Parent sends a new message to the campus.
   */
  async sendMessage(schoolId, userId, data) {
    const { studentId, subject, message } = data;
    if (studentId) {
      await this.assertChildOfParent(schoolId, userId, null, studentId);
    }
    if (!subject || !subject.trim()) throw new Error('Subject is required');
    if (!message || !message.trim()) throw new Error('Message is required');

    const rows = await sql`
      INSERT INTO campus_messages (school_id, user_id, student_id, subject, message, status, created_by)
      VALUES (${schoolId}, ${userId}, ${studentId || null}, ${subject.trim()}, ${message.trim()}, 'open', 'parent')
      RETURNING *
    `;
    return this.formatMessage(rows[0]);
  }

  /**
   * Parent replies to one of their own message threads.
   */
  async replyToMessage(schoolId, userId, messageId, data) {
    const { message } = data;
    if (!message || !message.trim()) throw new Error('Message is required');

    const owned = await sql`
      SELECT message_id FROM campus_messages
      WHERE message_id = ${messageId} AND school_id = ${schoolId} AND user_id = ${userId}
    `;
    if (owned.length === 0) throw new Error('Message not found');

    const rows = await sql`
      INSERT INTO campus_message_replies (message_id, school_id, user_id, message, is_admin)
      VALUES (${messageId}, ${schoolId}, ${userId}, ${message.trim()}, false)
      RETURNING *
    `;
    await sql`
      UPDATE campus_messages SET updated_at = NOW(), status = CASE WHEN status = 'resolved' THEN 'open' ELSE status END
      WHERE message_id = ${messageId}
    `;
    return this.formatReply(rows[0]);
  }
}

module.exports = new ParentService();
