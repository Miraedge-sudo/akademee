const sql = require('../../config/database');
const slugGenerator = require('../../utils/slugGenerator');

class ProgramService {
  formatProgram(row) {
    if (!row) return null;
    return {
      id: row.program_id,
      schoolId: row.school_id,
      departmentId: row.department_id,
      departmentName: row.department_name,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      name: row.name,
      nameFr: row.name_fr,
      code: row.code,
      cycle: row.cycle,
      durationYears: row.duration_years,
      creditsTotal: row.credits_total,
      description: row.description,
      admissionRequirements: row.admission_requirements,
      careerOpportunities: row.career_opportunities,
      language: row.language,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(schoolId, data) {
    const {
      department_id, faculty_id, name, name_fr, code, cycle, duration_years,
      credits_total, description, admission_requirements, career_opportunities, language, is_active,
    } = data;

    await this.assertRelations(schoolId, { department_id, faculty_id });

    const rows = await sql`
      INSERT INTO programs (
        school_id, department_id, faculty_id, name, name_fr, code, cycle, duration_years,
        credits_total, description, admission_requirements, career_opportunities, language, is_active
      ) VALUES (
        ${schoolId}, ${department_id || null}, ${faculty_id || null}, ${name}, ${name_fr || null},
        ${code}, ${cycle}, ${duration_years}, ${credits_total || null}, ${description || null},
        ${admission_requirements || null}, ${career_opportunities || null}, ${language || 'FR'},
        ${is_active ?? true}
      )
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].program_id);
  }

  async getById(schoolId, programId) {
    const rows = await sql`
      SELECT p.*, d.name AS department_name, f.name AS faculty_name
      FROM programs p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN faculties f ON p.faculty_id = f.faculty_id
      WHERE p.program_id = ${programId} AND p.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Program not found');
    return this.formatProgram(rows[0]);
  }

  async listBySchool(schoolId, { page = 1, limit = 20, search = '', facultyId = '', departmentId = '', cycle = '' } = {}) {
    limit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * limit;

    let where = sql`WHERE p.school_id = ${schoolId}`;
    if (facultyId) where = sql`${where} AND p.faculty_id = ${facultyId}`;
    if (departmentId) where = sql`${where} AND p.department_id = ${departmentId}`;
    if (cycle) where = sql`${where} AND p.cycle = ${cycle}`;
    if (search) {
      const pattern = `%${search}%`;
      where = sql`${where} AND (p.name ILIKE ${pattern} OR p.name_fr ILIKE ${pattern} OR p.code ILIKE ${pattern})`;
    }

    const [countRows] = await sql`
      SELECT COUNT(*)::int AS total FROM programs p ${where}
    `;
    const total = countRows.total;

    const rows = await sql`
      SELECT p.*, d.name AS department_name, f.name AS faculty_name
      FROM programs p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN faculties f ON p.faculty_id = f.faculty_id
      ${where}
      ORDER BY p.cycle ASC, p.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map((r) => this.formatProgram(r)),
      pagination: { page, limit, total },
    };
  }

  async update(schoolId, programId, data) {
    await this.getById(schoolId, programId);
    const {
      department_id, faculty_id, name, name_fr, code, cycle, duration_years,
      credits_total, description, admission_requirements, career_opportunities, language, is_active,
    } = data;

    if (department_id || faculty_id) {
      await this.assertRelations(schoolId, { department_id, faculty_id });
    }

    const rows = await sql`
      UPDATE programs SET
        department_id = COALESCE(${department_id || null}, department_id),
        faculty_id = COALESCE(${faculty_id || null}, faculty_id),
        name = COALESCE(${name || null}, name),
        name_fr = COALESCE(${name_fr || null}, name_fr),
        code = COALESCE(${code || null}, code),
        cycle = COALESCE(${cycle || null}, cycle),
        duration_years = COALESCE(${duration_years || null}, duration_years),
        credits_total = COALESCE(${credits_total || null}, credits_total),
        description = COALESCE(${description || null}, description),
        admission_requirements = COALESCE(${admission_requirements || null}, admission_requirements),
        career_opportunities = COALESCE(${career_opportunities || null}, career_opportunities),
        language = COALESCE(${language || null}, language),
        is_active = COALESCE(${is_active || null}, is_active),
        updated_at = now()
      WHERE program_id = ${programId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].program_id);
  }

  async delete(schoolId, programId) {
    await this.getById(schoolId, programId);
    await sql`DELETE FROM programs WHERE program_id = ${programId} AND school_id = ${schoolId}`;
    return { deleted: true, programId };
  }

  async assertRelations(schoolId, { department_id, faculty_id }) {
    if (department_id) {
      const [department] = await sql`
        SELECT department_id FROM departments WHERE department_id = ${department_id} AND school_id = ${schoolId}
      `;
      if (!department) throw new Error('Department not found');
    }
    if (faculty_id) {
      const [faculty] = await sql`
        SELECT faculty_id FROM faculties WHERE faculty_id = ${faculty_id} AND school_id = ${schoolId}
      `;
      if (!faculty) throw new Error('Faculty not found');
    }
  }

  static generateSlug(text) {
    return slugGenerator.sanitize(text);
  }
}

module.exports = new ProgramService();
