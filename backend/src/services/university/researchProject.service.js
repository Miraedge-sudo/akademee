const sql = require('../../config/database');
const slugGenerator = require('../../utils/slugGenerator');

class ResearchProjectService {
  formatProject(row) {
    if (!row) return null;
    return {
      id: row.project_id,
      schoolId: row.school_id,
      departmentId: row.department_id,
      departmentName: row.department_name,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      title: row.title,
      titleFr: row.title_fr,
      slug: row.slug,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      fundingSource: row.funding_source,
      budget: row.budget,
      principalInvestigator: row.principal_investigator,
      investigators: row.investigators || [],
      summary: row.summary,
      keywords: row.keywords || [],
      isPublished: row.is_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(schoolId, data) {
    const {
      department_id, faculty_id, title, title_fr, status, start_date, end_date,
      funding_source, budget, principal_investigator, investigators, summary, keywords, is_published,
    } = data;

    await this.assertRelations(schoolId, { department_id, faculty_id });

    const slug = await this.generateUniqueSlug(schoolId, title);

    const rows = await sql`
      INSERT INTO research_projects (
        school_id, department_id, faculty_id, title, title_fr, slug, status, start_date, end_date,
        funding_source, budget, principal_investigator, investigators, summary, keywords, is_published
      ) VALUES (
        ${schoolId}, ${department_id || null}, ${faculty_id || null}, ${title}, ${title_fr || null},
        ${slug}, ${status || 'PLANNED'}, ${start_date || null}, ${end_date || null},
        ${funding_source || null}, ${budget || null}, ${principal_investigator || null},
        ${investigators || []}, ${summary || null}, ${keywords || []}, ${is_published ?? false}
      )
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].project_id);
  }

  async getById(schoolId, projectId) {
    const rows = await sql`
      SELECT p.*, d.name AS department_name, f.name AS faculty_name
      FROM research_projects p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN faculties f ON p.faculty_id = f.faculty_id
      WHERE p.project_id = ${projectId} AND p.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Research project not found');
    return this.formatProject(rows[0]);
  }

  async listBySchool(schoolId, { page = 1, limit = 20, search = '', facultyId = '', departmentId = '', status = '', isPublished } = {}) {
    limit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * limit;

    let where = sql`WHERE p.school_id = ${schoolId}`;
    if (facultyId) where = sql`${where} AND p.faculty_id = ${facultyId}`;
    if (departmentId) where = sql`${where} AND p.department_id = ${departmentId}`;
    if (status) where = sql`${where} AND p.status = ${status}`;
    if (isPublished !== undefined && isPublished !== '') where = sql`${where} AND p.is_published = ${isPublished}`;
    if (search) {
      const pattern = `%${search}%`;
      where = sql`${where} AND (p.title ILIKE ${pattern} OR p.title_fr ILIKE ${pattern} OR p.principal_investigator ILIKE ${pattern}
             OR EXISTS (SELECT 1 FROM unnest(p.keywords) kw WHERE kw ILIKE ${pattern}))`;
    }

    const [countRows] = await sql`
      SELECT COUNT(*)::int AS total FROM research_projects p ${where}
    `;
    const total = countRows.total;

    const rows = await sql`
      SELECT p.*, d.name AS department_name, f.name AS faculty_name
      FROM research_projects p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN faculties f ON p.faculty_id = f.faculty_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map((r) => this.formatProject(r)),
      pagination: { page, limit, total },
    };
  }

  async update(schoolId, projectId, data) {
    await this.getById(schoolId, projectId);
    const {
      department_id, faculty_id, title, title_fr, status, start_date, end_date,
      funding_source, budget, principal_investigator, investigators, summary, keywords, is_published,
    } = data;

    if (department_id || faculty_id) {
      await this.assertRelations(schoolId, { department_id, faculty_id });
    }

    const slug = title
      ? await this.generateUniqueSlug(schoolId, title, projectId)
      : undefined;

    const rows = await sql`
      UPDATE research_projects SET
        department_id = COALESCE(${department_id || null}, department_id),
        faculty_id = COALESCE(${faculty_id || null}, faculty_id),
        title = COALESCE(${title || null}, title),
        title_fr = COALESCE(${title_fr || null}, title_fr),
        slug = COALESCE(${slug || null}, slug),
        status = COALESCE(${status || null}, status),
        start_date = COALESCE(${start_date || null}, start_date),
        end_date = COALESCE(${end_date || null}, end_date),
        funding_source = COALESCE(${funding_source || null}, funding_source),
        budget = COALESCE(${budget || null}, budget),
        principal_investigator = COALESCE(${principal_investigator || null}, principal_investigator),
        investigators = COALESCE(${investigators || null}, investigators),
        summary = COALESCE(${summary || null}, summary),
        keywords = COALESCE(${keywords || null}, keywords),
        is_published = COALESCE(${is_published || null}, is_published),
        updated_at = now()
      WHERE project_id = ${projectId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].project_id);
  }

  async delete(schoolId, projectId) {
    await this.getById(schoolId, projectId);
    await sql`
      UPDATE publications SET research_project_id = NULL
      WHERE research_project_id = ${projectId} AND school_id = ${schoolId}
    `;
    await sql`DELETE FROM research_projects WHERE project_id = ${projectId} AND school_id = ${schoolId}`;
    return { deleted: true, projectId };
  }

  async listPublic(schoolId, { page = 1, limit = 20, search = '', status = '' } = {}) {
    limit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * limit;

    let where = sql`WHERE p.school_id = ${schoolId} AND p.is_published = true`;
    if (status) where = sql`${where} AND p.status = ${status}`;
    if (search) {
      const pattern = `%${search}%`;
      where = sql`${where} AND (p.title ILIKE ${pattern} OR p.title_fr ILIKE ${pattern} OR p.principal_investigator ILIKE ${pattern})`;
    }

    const [countRows] = await sql`
      SELECT COUNT(*)::int AS total FROM research_projects p ${where}
    `;
    const total = countRows.total;

    const rows = await sql`
      SELECT p.*, d.name AS department_name, f.name AS faculty_name
      FROM research_projects p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN faculties f ON p.faculty_id = f.faculty_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map((r) => this.formatProject(r)),
      pagination: { page, limit, total },
    };
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

  async generateUniqueSlug(schoolId, title, excludeId = null) {
    const base = slugGenerator.sanitize(title) || 'project';
    let slug = base;
    let suffix = 2;

    // eslint-disable-next-line no-await-in-loop
    while (await this.slugExists(schoolId, slug, excludeId)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }

  async slugExists(schoolId, slug, excludeId) {
    const rows = excludeId
      ? await sql`
          SELECT 1 FROM research_projects WHERE school_id = ${schoolId} AND slug = ${slug} AND project_id != ${excludeId} LIMIT 1
        `
      : await sql`
          SELECT 1 FROM research_projects WHERE school_id = ${schoolId} AND slug = ${slug} LIMIT 1
        `;
    return rows.length > 0;
  }
}

module.exports = new ResearchProjectService();
