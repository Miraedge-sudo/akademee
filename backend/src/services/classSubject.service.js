const sql = require('../config/database');

class ClassSubjectService {
  format(row) {
    return {
      id: row.class_subject_id,
      schoolId: row.school_id,
      classId: row.class_id,
      className: row.class_name,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      coefficient: Number(row.coefficient),
      isCompulsory: row.is_compulsory,
    };
  }

  async assign(schoolId, data) {
    const { classId, subjectId, coefficient, isCompulsory } = data;
    const rows = await sql`
      INSERT INTO class_subjects (school_id, class_id, subject_id, coefficient, is_compulsory)
      VALUES (${schoolId}, ${classId}, ${subjectId}, ${coefficient || 1}, ${isCompulsory ?? true})
      ON CONFLICT (class_id, subject_id) DO UPDATE SET coefficient = EXCLUDED.coefficient, is_compulsory = EXCLUDED.is_compulsory
      RETURNING *
    `;
    return this.format(rows[0]);
  }

  async listByClass(schoolId, classId) {
    const rows = await sql`
      SELECT cs.*, s.name AS subject_name, c.name AS class_name
      FROM class_subjects cs
      JOIN subjects s ON cs.subject_id = s.subject_id
      JOIN classes c ON cs.class_id = c.class_id
      WHERE cs.school_id = ${schoolId} AND cs.class_id = ${classId}
      ORDER BY s.name ASC
    `;
    return rows.map(r => this.format(r));
  }

  async listBySchool(schoolId, { limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT cs.*, s.name AS subject_name, c.name AS class_name
      FROM class_subjects cs
      JOIN subjects s ON cs.subject_id = s.subject_id
      JOIN classes c ON cs.class_id = c.class_id
      WHERE cs.school_id = ${schoolId}
      ORDER BY c.name ASC, s.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM class_subjects WHERE school_id = ${schoolId}
    `;

    return {
      assignments: rows.map(r => this.format(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async remove(schoolId, classSubjectId) {
    const rows = await sql`
      DELETE FROM class_subjects WHERE class_subject_id = ${classSubjectId} AND school_id = ${schoolId}
      RETURNING class_subject_id
    `;
    if (rows.length === 0) throw new Error('Assignment not found');
    return { deleted: true, classSubjectId };
  }

  async bulkAssign(schoolId, classId, subjects) {
    if (!subjects || subjects.length === 0) return [];
    // subjects can be either an array of UUID strings (legacy) or an array of { subjectId, coefficient? }
    const values = subjects.map(s => {
      const subjectId = typeof s === 'string' ? s : s.subjectId;
      const coefficient = typeof s === 'string' ? null : (s.coefficient || null);
      return {
        school_id: schoolId,
        class_id: classId,
        subject_id: subjectId,
        coefficient,
      };
    });
    const rows = await sql`
      INSERT INTO class_subjects (school_id, class_id, subject_id, coefficient)
      SELECT * FROM jsonb_to_recordset(${sql.json(values)})
        AS x(school_id uuid, class_id uuid, subject_id uuid, coefficient numeric)
      ON CONFLICT (class_id, subject_id) DO UPDATE SET
        coefficient = COALESCE(EXCLUDED.coefficient, class_subjects.coefficient)
      RETURNING *
    `;
    return rows.map(r => this.format(r));
  }
}

module.exports = new ClassSubjectService();
