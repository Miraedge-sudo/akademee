const sql = require('../../config/database');

class FacultyService {
  formatFaculty(row) {
    if (!row) return null;
    return {
      id: row.faculty_id,
      schoolId: row.school_id,
      name: row.name,
      nameFr: row.name_fr,
      code: row.code,
      deanName: row.dean_name,
      description: row.description,
      phone: row.phone,
      email: row.email,
      building: row.building,
      establishedYear: row.established_year,
      isActive: row.is_active,
      departmentsCount: row.departments_count ?? undefined,
      programsCount: row.programs_count ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(schoolId, data) {
    const {
      name, name_fr, code, dean_name, description, phone, email, building, established_year, is_active,
    } = data;

    const rows = await sql`
      INSERT INTO faculties (
        school_id, name, name_fr, code, dean_name, description, phone, email, building, established_year, is_active
      ) VALUES (
        ${schoolId}, ${name}, ${name_fr || null}, ${code}, ${dean_name || null},
        ${description || null}, ${phone || null}, ${email || null}, ${building || null},
        ${established_year || null}, ${is_active ?? true}
      )
      RETURNING *
    `;
    return this.formatFaculty(rows[0]);
  }

  async getById(schoolId, facultyId) {
    const rows = await sql`
      SELECT f.*,
        (SELECT COUNT(*) FROM departments d WHERE d.faculty_id = f.faculty_id)::int AS departments_count,
        (SELECT COUNT(*) FROM programs p WHERE p.faculty_id = f.faculty_id)::int AS programs_count
      FROM faculties f
      WHERE f.faculty_id = ${facultyId} AND f.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Faculty not found');
    return this.formatFaculty(rows[0]);
  }

  async listBySchool(schoolId, { page = 1, limit = 20, search = '' } = {}) {
    limit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * limit;

    let where = sql`WHERE f.school_id = ${schoolId}`;
    if (search) {
      const pattern = `%${search}%`;
      where = sql`${where} AND (f.name ILIKE ${pattern} OR f.name_fr ILIKE ${pattern} OR f.code ILIKE ${pattern}
             OR f.dean_name ILIKE ${pattern})`;
    }

    const [countRows] = await sql`
      SELECT COUNT(*)::int AS total FROM faculties f ${where}
    `;
    const total = countRows.total;

    const rows = await sql`
      SELECT f.*,
        (SELECT COUNT(*) FROM departments d WHERE d.faculty_id = f.faculty_id)::int AS departments_count,
        (SELECT COUNT(*) FROM programs p WHERE p.faculty_id = f.faculty_id)::int AS programs_count
      FROM faculties f
      ${where}
      ORDER BY f.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map((r) => this.formatFaculty(r)),
      pagination: { page, limit, total },
    };
  }

  async update(schoolId, facultyId, data) {
    await this.getById(schoolId, facultyId);
    const {
      name, name_fr, code, dean_name, description, phone, email, building, established_year, is_active,
    } = data;

    const rows = await sql`
      UPDATE faculties SET
        name = COALESCE(${name || null}, name),
        name_fr = COALESCE(${name_fr || null}, name_fr),
        code = COALESCE(${code || null}, code),
        dean_name = COALESCE(${dean_name || null}, dean_name),
        description = COALESCE(${description || null}, description),
        phone = COALESCE(${phone || null}, phone),
        email = COALESCE(${email || null}, email),
        building = COALESCE(${building || null}, building),
        established_year = COALESCE(${established_year || null}, established_year),
        is_active = COALESCE(${is_active || null}, is_active),
        updated_at = now()
      WHERE faculty_id = ${facultyId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatFaculty(rows[0]);
  }

  async delete(schoolId, facultyId) {
    await this.getById(schoolId, facultyId);

    const [depRow] = await sql`
      SELECT COUNT(*)::int AS total FROM departments WHERE faculty_id = ${facultyId}
    `;
    if (depRow.total > 0) {
      throw new Error(`Cannot delete faculty: ${depRow.total} department(s) still reference it`);
    }

    await sql`DELETE FROM faculties WHERE faculty_id = ${facultyId} AND school_id = ${schoolId}`;
    return { deleted: true, facultyId };
  }

  async getStats(schoolId, facultyId) {
    await this.getById(schoolId, facultyId);

    const [depRow] = await sql`
      SELECT COUNT(*)::int AS total FROM departments WHERE faculty_id = ${facultyId} AND school_id = ${schoolId}
    `;

    const [progRow] = await sql`
      SELECT COUNT(*)::int AS total FROM programs WHERE faculty_id = ${facultyId} AND school_id = ${schoolId}
    `;

    const cycleRows = await sql`
      SELECT cycle, COUNT(*)::int AS total
      FROM programs
      WHERE faculty_id = ${facultyId} AND school_id = ${schoolId}
      GROUP BY cycle
    `;
    const programsByCycle = {
      LICENCE: 0,
      MASTER: 0,
      DOCTORATE: 0,
    };
    cycleRows.forEach((r) => {
      programsByCycle[r.cycle] = r.total;
    });

    const [researchRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM research_projects
      WHERE faculty_id = ${facultyId}
        AND school_id = ${schoolId}
        AND status IN ('PLANNED', 'IN_PROGRESS', 'ON_HOLD')
    `;

    const [pubRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM publications
      WHERE faculty_id = ${facultyId} AND school_id = ${schoolId}
    `;

    const [pubYearRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM publications
      WHERE faculty_id = ${facultyId}
        AND school_id = ${schoolId}
        AND EXTRACT(YEAR FROM publication_date) = EXTRACT(YEAR FROM now())
    `;

    return {
      facultyId,
      departmentsCount: depRow.total,
      programsCount: progRow.total,
      programsByCycle,
      activeResearchProjects: researchRow.total,
      publicationsCount: pubRow.total,
      publicationsThisYear: pubYearRow.total,
    };
  }

  async listProgramsByFaculty(schoolId, facultyId, { page = 1, limit = 20, cycle } = {}) {
    await this.getById(schoolId, facultyId);
    limit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * limit;

    let where = sql`WHERE p.faculty_id = ${facultyId} AND p.school_id = ${schoolId}`;
    if (cycle) where = sql`${where} AND p.cycle = ${cycle}`;

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
      items: rows.map((r) => ({
        ...this.formatProgram(r),
        departmentName: r.department_name,
        facultyName: r.faculty_name,
      })),
      pagination: { page, limit, total },
    };
  }

  formatProgram(row) {
    return {
      id: row.program_id,
      schoolId: row.school_id,
      departmentId: row.department_id,
      facultyId: row.faculty_id,
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

}

module.exports = new FacultyService();
