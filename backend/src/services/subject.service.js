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

  /**
   * Auto-generate a short code from the subject name.
   * Takes the first 3 characters of the name.
   * If the name has only 2 characters, takes those 2.
   */
  generateCode(name) {
    if (!name || !name.trim()) return null;
    const trimmed = name.trim();
    const length = Math.min(trimmed.length, 3);
    return trimmed.slice(0, length).toUpperCase();
  }

  async create(schoolId, data) {
    const { name, code, coefficient } = data;
    const finalCode = code || this.generateCode(name);
    const rows = await sql`
      INSERT INTO subjects (school_id, name, code, coefficient)
      VALUES (${schoolId}, ${name}, ${finalCode}, ${coefficient || 1})
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
    const { name, code, coefficient } = data;
    const rows = await sql`
      UPDATE subjects SET
        name = COALESCE(${name || null}, name),
        code = COALESCE(${code || null}, code),
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
