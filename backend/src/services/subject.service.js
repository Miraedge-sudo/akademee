const sql = require('../config/database');

class SubjectService {
  formatSubject(row) {
    return {
      id: row.subject_id,
      schoolId: row.school_id,
      name: row.name,
      code: row.code || row.name,
      coefficient: row.coefficient || 1,
    };
  }

  async create(schoolId, data) {
    const { name, code, coefficient } = data;
    const rows = await sql`
      INSERT INTO subjects (school_id, name, coefficient)
      VALUES (${schoolId}, ${name}, ${coefficient || 1})
      RETURNING *
    `;
    return this.formatSubject(rows[0]);
  }

  async getById(schoolId, subjectId) {
    const rows = await sql`
      SELECT * FROM subjects WHERE subject_id = ${subjectId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Subject not found');
    return this.formatSubject(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT * FROM subjects WHERE school_id = ${schoolId} ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM subjects WHERE school_id = ${schoolId}
    `;

    return {
      subjects: rows.map(r => this.formatSubject(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async update(schoolId, subjectId, data) {
    await this.getById(schoolId, subjectId);
    const { name, coefficient } = data;
    const rows = await sql`
      UPDATE subjects SET
        name = COALESCE(${name || null}, name),
        coefficient = COALESCE(${coefficient ?? null}, coefficient)
      WHERE subject_id = ${subjectId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatSubject(rows[0]);
  }

  async delete(schoolId, subjectId) {
    await this.getById(schoolId, subjectId);
    await sql`DELETE FROM subjects WHERE subject_id = ${subjectId} AND school_id = ${schoolId}`;
    return { deleted: true, subjectId };
  }
}

module.exports = new SubjectService();
