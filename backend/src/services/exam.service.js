const sql = require('../config/database');

class ExamService {
  formatExam(row) {
    return {
      id: row.exam_id,
      schoolId: row.school_id,
      name: row.name,
      examType: row.exam_type,
      academicYearId: row.academic_year_id,
      registrationStart: row.registration_start,
      registrationEnd: row.registration_end,
      examStartDate: row.exam_start_date,
      examEndDate: row.exam_end_date,
      fee: Number(row.fee),
      maxCandidates: row.max_candidates,
      createdAt: row.created_at,
    };
  }

  formatRegistration(row) {
    return {
      id: row.exam_registration_id,
      schoolId: row.school_id,
      examId: row.exam_id,
      examName: row.exam_name,
      studentId: row.student_id,
      studentName: row.student_name,
      centerId: row.center_id,
      registrationNumber: row.registration_number,
      status: row.status,
      feePaid: row.fee_paid,
      result: row.result,
      grade: row.grade,
    };
  }

  async create(schoolId, data) {
    const { name, examType, academicYearId, registrationStart, registrationEnd, examStartDate, examEndDate, fee, maxCandidates } = data;
    const rows = await sql`
      INSERT INTO exams (school_id, name, exam_type, academic_year_id, registration_start, registration_end, exam_start_date, exam_end_date, fee, max_candidates)
      VALUES (${schoolId}, ${name}, ${examType}, ${academicYearId || null}, ${registrationStart || null}, ${registrationEnd || null}, ${examStartDate || null}, ${examEndDate || null}, ${fee || 0}, ${maxCandidates || null})
      RETURNING *
    `;
    return this.formatExam(rows[0]);
  }

  async getById(schoolId, examId) {
    const rows = await sql`
      SELECT * FROM exams WHERE exam_id = ${examId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Exam not found');
    return this.formatExam(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT * FROM exams WHERE school_id = ${schoolId} ORDER BY exam_start_date DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM exams WHERE school_id = ${schoolId}
    `;

    return {
      exams: rows.map(r => this.formatExam(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async update(schoolId, examId, data) {
    await this.getById(schoolId, examId);
    const { name, examType, academicYearId, registrationStart, registrationEnd, examStartDate, examEndDate, fee, maxCandidates } = data;
    const rows = await sql`
      UPDATE exams SET
        name = COALESCE(${name || null}, name),
        exam_type = COALESCE(${examType || null}, exam_type),
        academic_year_id = COALESCE(${academicYearId || null}, academic_year_id),
        registration_start = COALESCE(${registrationStart || null}, registration_start),
        registration_end = COALESCE(${registrationEnd || null}, registration_end),
        exam_start_date = COALESCE(${examStartDate || null}, exam_start_date),
        exam_end_date = COALESCE(${examEndDate || null}, exam_end_date),
        fee = COALESCE(${fee ?? null}, fee),
        max_candidates = COALESCE(${maxCandidates ?? null}, max_candidates)
      WHERE exam_id = ${examId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatExam(rows[0]);
  }

  async delete(schoolId, examId) {
    await this.getById(schoolId, examId);
    await sql`DELETE FROM exams WHERE exam_id = ${examId} AND school_id = ${schoolId}`;
    return { deleted: true, examId };
  }

  async registerStudent(schoolId, data) {
    const { examId, studentId, centerId } = data;
    await this.getById(schoolId, examId);

    const existing = await sql`
      SELECT exam_registration_id FROM exam_registrations WHERE exam_id = ${examId} AND student_id = ${studentId} AND school_id = ${schoolId}
    `;
    if (existing.length > 0) throw new Error('Student already registered for this exam');

    const regNumber = `REG-${examId.slice(0, 8)}-${studentId.slice(0, 8)}`.toUpperCase();
    const rows = await sql`
      INSERT INTO exam_registrations (school_id, exam_id, student_id, center_id, registration_number, status)
      VALUES (${schoolId}, ${examId}, ${studentId}, ${centerId || null}, ${regNumber}, 'registered')
      RETURNING *
    `;
    return this.formatRegistration(rows[0]);
  }

  async listRegistrations(schoolId, examId) {
    const rows = await sql`
      SELECT er.*, e.name AS exam_name, CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM exam_registrations er
      JOIN exams e ON er.exam_id = e.exam_id
      JOIN students st ON er.student_id = st.student_id
      JOIN users u ON st.user_id = u.user_id
      WHERE er.school_id = ${schoolId} AND er.exam_id = ${examId}
      ORDER BY u.first_name ASC
    `;
    return rows.map(r => this.formatRegistration(r));
  }

  async recordResult(schoolId, registrationId, data) {
    const { result, grade } = data;
    const rows = await sql`
      UPDATE exam_registrations SET result = ${result ?? null}, grade = ${grade || null}, status = 'completed'
      WHERE exam_registration_id = ${registrationId} AND school_id = ${schoolId}
      RETURNING *
    `;
    if (rows.length === 0) throw new Error('Registration not found');
    return this.formatRegistration(rows[0]);
  }
}

module.exports = new ExamService();
