const sql = require('../../config/database');

class DepartmentService {
  formatDepartment(row) {
    if (!row) return null;
    return {
      id: row.department_id,
      schoolId: row.school_id,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      name: row.name,
      nameFr: row.name_fr,
      code: row.code,
      headName: row.head_name,
      description: row.description,
      phone: row.phone,
      email: row.email,
      isActive: row.is_active,
      programsCount: row.programs_count ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(schoolId, data) {
    const {
      faculty_id, name, name_fr, code, head_name, description, phone, email, is_active,
    } = data;

    const [faculty] = await sql`
      SELECT faculty_id FROM faculties WHERE faculty_id = ${faculty_id} AND school_id = ${schoolId}
    `;
    if (!faculty) throw new Error('Faculty not found');

    const rows = await sql`
      INSERT INTO departments (
        school_id, faculty_id, name, name_fr, code, head_name, description, phone, email, is_active
      ) VALUES (
        ${schoolId}, ${faculty_id}, ${name}, ${name_fr || null}, ${code}, ${head_name || null},
        ${description || null}, ${phone || null}, ${email || null}, ${is_active ?? true}
      )
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].department_id);
  }

  async getById(schoolId, departmentId) {
    const rows = await sql`
      SELECT d.*, f.name AS faculty_name
      FROM departments d
      LEFT JOIN faculties f ON d.faculty_id = f.faculty_id
      WHERE d.department_id = ${departmentId} AND d.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Department not found');
    return this.formatDepartment(rows[0]);
  }

  async listBySchool(schoolId, { page = 1, limit = 20, search = '', facultyId = '' } = {}) {
    limit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * limit;

    let where = sql`WHERE d.school_id = ${schoolId}`;
    if (facultyId) where = sql`${where} AND d.faculty_id = ${facultyId}`;
    if (search) {
      const pattern = `%${search}%`;
      where = sql`${where} AND (d.name ILIKE ${pattern} OR d.name_fr ILIKE ${pattern} OR d.code ILIKE ${pattern}
             OR d.head_name ILIKE ${pattern})`;
    }

    const [countRows] = await sql`
      SELECT COUNT(*)::int AS total FROM departments d ${where}
    `;
    const total = countRows.total;

    const rows = await sql`
      SELECT d.*, f.name AS faculty_name,
        (SELECT COUNT(*) FROM programs p WHERE p.department_id = d.department_id)::int AS programs_count
      FROM departments d
      LEFT JOIN faculties f ON d.faculty_id = f.faculty_id
      ${where}
      ORDER BY d.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map((r) => this.formatDepartment(r)),
      pagination: { page, limit, total },
    };
  }

  async update(schoolId, departmentId, data) {
    await this.getById(schoolId, departmentId);
    const {
      faculty_id, name, name_fr, code, head_name, description, phone, email, is_active,
    } = data;

    if (faculty_id) {
      const [faculty] = await sql`
        SELECT faculty_id FROM faculties WHERE faculty_id = ${faculty_id} AND school_id = ${schoolId}
      `;
      if (!faculty) throw new Error('Faculty not found');
    }

    const rows = await sql`
      UPDATE departments SET
        faculty_id = COALESCE(${faculty_id || null}, faculty_id),
        name = COALESCE(${name || null}, name),
        name_fr = COALESCE(${name_fr || null}, name_fr),
        code = COALESCE(${code || null}, code),
        head_name = COALESCE(${head_name || null}, head_name),
        description = COALESCE(${description || null}, description),
        phone = COALESCE(${phone || null}, phone),
        email = COALESCE(${email || null}, email),
        is_active = COALESCE(${is_active || null}, is_active),
        updated_at = now()
      WHERE department_id = ${departmentId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].department_id);
  }

  async delete(schoolId, departmentId) {
    await this.getById(schoolId, departmentId);

    const [progRow] = await sql`
      SELECT COUNT(*)::int AS total FROM programs WHERE department_id = ${departmentId}
    `;
    if (progRow.total > 0) {
      throw new Error(`Cannot delete department: ${progRow.total} program(s) still reference it`);
    }

    await sql`DELETE FROM departments WHERE department_id = ${departmentId} AND school_id = ${schoolId}`;
    return { deleted: true, departmentId };
  }
}

module.exports = new DepartmentService();
