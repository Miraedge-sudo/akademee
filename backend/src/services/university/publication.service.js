const sql = require('../../config/database');

class PublicationService {
  formatPublication(row) {
    if (!row) return null;
    return {
      id: row.publication_id,
      schoolId: row.school_id,
      researchProjectId: row.research_project_id,
      researchProjectTitle: row.research_project_title,
      departmentId: row.department_id,
      departmentName: row.department_name,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      title: row.title,
      titleFr: row.title_fr,
      type: row.type,
      authors: row.authors || [],
      journalName: row.journal_name,
      publisher: row.publisher,
      doi: row.doi,
      issn: row.issn,
      isbn: row.isbn,
      publicationDate: row.publication_date,
      volume: row.volume,
      issue: row.issue,
      pages: row.pages,
      abstract: row.abstract,
      keywords: row.keywords || [],
      url: row.url,
      citation: row.citation,
      isPublished: row.is_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(schoolId, data) {
    const {
      research_project_id, department_id, faculty_id, title, title_fr, type, authors,
      journal_name, publisher, doi, issn, isbn, publication_date, volume, issue, pages,
      abstract, keywords, url, citation, is_published,
    } = data;

    await this.assertRelations(schoolId, { research_project_id, department_id, faculty_id });

    const rows = await sql`
      INSERT INTO publications (
        school_id, research_project_id, department_id, faculty_id, title, title_fr, type, authors,
        journal_name, publisher, doi, issn, isbn, publication_date, volume, issue, pages,
        abstract, keywords, url, citation, is_published
      ) VALUES (
        ${schoolId}, ${research_project_id || null}, ${department_id || null}, ${faculty_id || null},
        ${title}, ${title_fr || null}, ${type}, ${authors || []}, ${journal_name || null},
        ${publisher || null}, ${doi || null}, ${issn || null}, ${isbn || null}, ${publication_date || null},
        ${volume || null}, ${issue || null}, ${pages || null}, ${abstract || null}, ${keywords || []},
        ${url || null}, ${citation || null}, ${is_published ?? false}
      )
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].publication_id);
  }

  async getById(schoolId, publicationId) {
    const rows = await sql`
      SELECT p.*, rp.title AS research_project_title, d.name AS department_name, f.name AS faculty_name
      FROM publications p
      LEFT JOIN research_projects rp ON p.research_project_id = rp.project_id
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN faculties f ON p.faculty_id = f.faculty_id
      WHERE p.publication_id = ${publicationId} AND p.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Publication not found');
    return this.formatPublication(rows[0]);
  }

  async listBySchool(schoolId, { page = 1, limit = 20, search = '', facultyId = '', departmentId = '', type = '', year = '', isPublished } = {}) {
    limit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * limit;

    let where = sql`WHERE p.school_id = ${schoolId}`;
    if (facultyId) where = sql`${where} AND p.faculty_id = ${facultyId}`;
    if (departmentId) where = sql`${where} AND p.department_id = ${departmentId}`;
    if (type) where = sql`${where} AND p.type = ${type}`;
    if (year) where = sql`${where} AND EXTRACT(YEAR FROM p.publication_date) = ${year}`;
    if (isPublished !== undefined && isPublished !== '') where = sql`${where} AND p.is_published = ${isPublished}`;
    if (search) {
      const pattern = `%${search}%`;
      where = sql`${where} AND (p.title ILIKE ${pattern} OR p.title_fr ILIKE ${pattern}
             OR EXISTS (SELECT 1 FROM unnest(p.authors) a WHERE a ILIKE ${pattern})
             OR EXISTS (SELECT 1 FROM unnest(p.keywords) kw WHERE kw ILIKE ${pattern}))`;
    }

    const [countRows] = await sql`
      SELECT COUNT(*)::int AS total FROM publications p ${where}
    `;
    const total = countRows.total;

    const rows = await sql`
      SELECT p.*, rp.title AS research_project_title, d.name AS department_name, f.name AS faculty_name
      FROM publications p
      LEFT JOIN research_projects rp ON p.research_project_id = rp.project_id
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN faculties f ON p.faculty_id = f.faculty_id
      ${where}
      ORDER BY p.publication_date DESC NULLS LAST, p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map((r) => this.formatPublication(r)),
      pagination: { page, limit, total },
    };
  }

  async update(schoolId, publicationId, data) {
    await this.getById(schoolId, publicationId);
    const {
      research_project_id, department_id, faculty_id, title, title_fr, type, authors,
      journal_name, publisher, doi, issn, isbn, publication_date, volume, issue, pages,
      abstract, keywords, url, citation, is_published,
    } = data;

    if (research_project_id || department_id || faculty_id) {
      await this.assertRelations(schoolId, { research_project_id, department_id, faculty_id });
    }

    const rows = await sql`
      UPDATE publications SET
        research_project_id = COALESCE(${research_project_id || null}, research_project_id),
        department_id = COALESCE(${department_id || null}, department_id),
        faculty_id = COALESCE(${faculty_id || null}, faculty_id),
        title = COALESCE(${title || null}, title),
        title_fr = COALESCE(${title_fr || null}, title_fr),
        type = COALESCE(${type || null}, type),
        authors = COALESCE(${authors || null}, authors),
        journal_name = COALESCE(${journal_name || null}, journal_name),
        publisher = COALESCE(${publisher || null}, publisher),
        doi = COALESCE(${doi || null}, doi),
        issn = COALESCE(${issn || null}, issn),
        isbn = COALESCE(${isbn || null}, isbn),
        publication_date = COALESCE(${publication_date || null}, publication_date),
        volume = COALESCE(${volume || null}, volume),
        issue = COALESCE(${issue || null}, issue),
        pages = COALESCE(${pages || null}, pages),
        abstract = COALESCE(${abstract || null}, abstract),
        keywords = COALESCE(${keywords || null}, keywords),
        url = COALESCE(${url || null}, url),
        citation = COALESCE(${citation || null}, citation),
        is_published = COALESCE(${is_published || null}, is_published),
        updated_at = now()
      WHERE publication_id = ${publicationId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.getById(schoolId, rows[0].publication_id);
  }

  async delete(schoolId, publicationId) {
    await this.getById(schoolId, publicationId);
    await sql`DELETE FROM publications WHERE publication_id = ${publicationId} AND school_id = ${schoolId}`;
    return { deleted: true, publicationId };
  }

  async listPublic(schoolId, { page = 1, limit = 20, search = '', type = '', year = '' } = {}) {
    limit = Math.min(Math.max(1, limit), 100);
    const offset = (Math.max(1, page) - 1) * limit;

    let where = sql`WHERE p.school_id = ${schoolId} AND p.is_published = true`;
    if (type) where = sql`${where} AND p.type = ${type}`;
    if (year) where = sql`${where} AND EXTRACT(YEAR FROM p.publication_date) = ${year}`;
    if (search) {
      const pattern = `%${search}%`;
      where = sql`${where} AND (p.title ILIKE ${pattern} OR p.title_fr ILIKE ${pattern}
             OR EXISTS (SELECT 1 FROM unnest(p.authors) a WHERE a ILIKE ${pattern}))`;
    }

    const [countRows] = await sql`
      SELECT COUNT(*)::int AS total FROM publications p ${where}
    `;
    const total = countRows.total;

    const rows = await sql`
      SELECT p.*, rp.title AS research_project_title, d.name AS department_name, f.name AS faculty_name
      FROM publications p
      LEFT JOIN research_projects rp ON p.research_project_id = rp.project_id
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN faculties f ON p.faculty_id = f.faculty_id
      ${where}
      ORDER BY p.publication_date DESC NULLS LAST, p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map((r) => this.formatPublication(r)),
      pagination: { page, limit, total },
    };
  }

  async assertRelations(schoolId, { research_project_id, department_id, faculty_id }) {
    if (research_project_id) {
      const [project] = await sql`
        SELECT project_id FROM research_projects WHERE project_id = ${research_project_id} AND school_id = ${schoolId}
      `;
      if (!project) throw new Error('Research project not found');
    }
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
}

module.exports = new PublicationService();
