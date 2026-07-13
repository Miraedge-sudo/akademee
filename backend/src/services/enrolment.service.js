/**
 * Enrolment Service — handles public enrolment inquiries from website templates.
 * No auth required — these are leads submitted by prospective parents.
 */

const sql = require('../config/database');

class EnrolmentService {
  formatInquiry(row) {
    return {
      id: row.inquiry_id,
      schoolId: row.school_id,
      parentName: row.parent_name,
      parentEmail: row.parent_email,
      parentPhone: row.parent_phone,
      studentName: row.student_name,
      studentAge: row.student_age,
      grade: row.grade,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async submit(schoolId, data) {
    const { parentName, parentEmail, parentPhone, studentName, studentAge, grade, message } = data;

    const rows = await sql`
      INSERT INTO enrolment_inquiries (school_id, parent_name, parent_email, parent_phone, student_name, student_age, grade, message)
      VALUES (${schoolId}, ${parentName}, ${parentEmail}, ${parentPhone || null}, ${studentName}, ${studentAge || null}, ${grade || null}, ${message || null})
      RETURNING *
    `;

    return this.formatInquiry(rows[0]);
  }

  async listBySchool(schoolId, { status, limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    let query = sql`SELECT * FROM enrolment_inquiries WHERE school_id = ${schoolId}`;
    let countQuery = sql`SELECT COUNT(*)::int AS total FROM enrolment_inquiries WHERE school_id = ${schoolId}`;

    if (status) {
      query = sql`${query} AND status = ${status}`;
      countQuery = sql`${countQuery} AND status = ${status}`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows, countRows] = await Promise.all([query, countQuery]);

    return {
      inquiries: rows.map(r => this.formatInquiry(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async updateStatus(schoolId, inquiryId, status) {
    const validStatuses = ['new', 'contacted', 'enrolled', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be one of: ' + validStatuses.join(', '));
    }

    const rows = await sql`
      UPDATE enrolment_inquiries SET status = ${status}
      WHERE inquiry_id = ${inquiryId} AND school_id = ${schoolId}
      RETURNING *
    `;

    if (rows.length === 0) throw new Error('Inquiry not found');
    return this.formatInquiry(rows[0]);
  }
}

module.exports = new EnrolmentService();
