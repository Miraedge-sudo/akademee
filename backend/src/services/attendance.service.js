const sql = require('../config/database');

class AttendanceService {
  formatAttendance(row) {
    return {
      id: row.attendance_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      studentName: row.student_name,
      classId: row.class_id,
      className: row.class_name,
      status: row.status,
      date: row.date,
      markedBy: row.marked_by,
      remarks: row.remarks,
      createdAt: row.created_at,
    };
  }

  async create(schoolId, data) {
    const { studentId, classId, academicYearId, date, status, markedBy, remarks } = data;
    const rows = await sql`
      INSERT INTO attendance (school_id, student_id, academic_year_id, date, status, class_id, marked_by, remarks)
      VALUES (${schoolId}, ${studentId}, ${academicYearId || null}, ${date}, ${status}, ${classId || null}, ${markedBy || null}, ${remarks || null})
      RETURNING *
    `;
    return this.formatAttendance(rows[0]);
  }

  async listByClass(schoolId, classId, { limit = 50, offset = 0, startDate, endDate, academicYearId } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT a.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM attendance a
      LEFT JOIN students st ON a.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE a.school_id = ${schoolId} AND a.class_id = ${classId}
        ${startDate ? sql`AND a.date >= ${startDate}` : sql``}
        ${endDate ? sql`AND a.date <= ${endDate}` : sql``}
        ${academicYearId ? sql`AND a.academic_year_id = ${academicYearId}` : sql``}
      ORDER BY a.date DESC, a.student_id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows.map(r => this.formatAttendance(r));
  }

  async getById(schoolId, attendanceId) {
    const rows = await sql`
      SELECT a.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM attendance a
      LEFT JOIN students st ON a.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE a.attendance_id = ${attendanceId} AND a.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Attendance record not found');
    return this.formatAttendance(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0, startDate, endDate, status, academicYearId } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT a.*,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        st.class_label
      FROM attendance a
      LEFT JOIN students st ON a.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE a.school_id = ${schoolId}
        ${startDate ? sql`AND a.date >= ${startDate}` : sql``}
        ${endDate ? sql`AND a.date <= ${endDate}` : sql``}
        ${status ? sql`AND a.status = ${status}` : sql``}
        ${academicYearId ? sql`AND a.academic_year_id = ${academicYearId}` : sql``}
      ORDER BY a.date DESC, a.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM attendance a
      WHERE a.school_id = ${schoolId}
        ${startDate ? sql`AND a.date >= ${startDate}` : sql``}
        ${endDate ? sql`AND a.date <= ${endDate}` : sql``}
        ${status ? sql`AND a.status = ${status}` : sql``}
        ${academicYearId ? sql`AND a.academic_year_id = ${academicYearId}` : sql``}
    `;

    return {
      records: rows.map(r => this.formatAttendance(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async listByStudent(schoolId, studentId, { limit = 50, offset = 0, academicYearId } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT a.*
      FROM attendance a
      WHERE a.school_id = ${schoolId} AND a.student_id = ${studentId}
        ${academicYearId ? sql`AND a.academic_year_id = ${academicYearId}` : sql``}
      ORDER BY a.date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return rows.map(r => this.formatAttendance(r));
  }

  async update(schoolId, attendanceId, data) {
    await this.getById(schoolId, attendanceId);
    const { status, remarks } = data;
    const rows = await sql`
      UPDATE attendance SET
        status = COALESCE(${status || null}, status),
        remarks = COALESCE(${remarks || null}, remarks)
      WHERE attendance_id = ${attendanceId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatAttendance(rows[0]);
  }

  async bulkCreate(schoolId, records) {
    if (!records || records.length === 0) {
      throw new Error('No attendance records provided');
    }
    const values = records.map(r => ({
      school_id: schoolId,
      student_id: r.studentId,
      date: r.date,
      status: r.status,
      class_id: r.classId || null,
      marked_by: r.markedBy || null,
      remarks: r.remarks || null,
      academic_year_id: r.academicYearId || null,
    }));
    const rows = await sql`
      INSERT INTO attendance (school_id, student_id, academic_year_id, date, status, class_id, marked_by, remarks)
      SELECT * FROM jsonb_to_recordset(${sql.json(values)})
        AS x(school_id uuid, student_id uuid, academic_year_id uuid, date date, status text, class_id uuid, marked_by uuid, remarks text)
      RETURNING *
    `;
    return rows.map(r => this.formatAttendance(r));
  }
}

module.exports = new AttendanceService();
