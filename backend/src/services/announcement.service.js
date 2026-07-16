const sql = require('../config/database');

class AnnouncementService {
  formatAnnouncement(row) {
    return {
      id: row.announcement_id,
      schoolId: row.school_id,
      title: row.title,
      content: row.content,
      targetAudience: row.target_audience,
      priority: row.priority,
      createdBy: row.created_by,
      creatorName: row.creator_name,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      files: row.files || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(schoolId, data) {
    const { title, content, targetAudience, priority, createdBy, isPublished, files } = data;
    const publishedAt = isPublished ? new Date() : null;
    const filesJson = JSON.stringify(files || []);
    const rows = await sql`
      INSERT INTO announcements (school_id, title, content, target_audience, priority, created_by, is_published, published_at, files)
      VALUES (${schoolId}, ${title}, ${content}, ${targetAudience || 'all'}, ${priority || 'normal'}, ${createdBy}, ${isPublished || false}, ${publishedAt}, ${filesJson}::jsonb)
      RETURNING *
    `;
    return this.formatAnnouncement(rows[0]);
  }

  async getById(schoolId, announcementId) {
    const rows = await sql`
      SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.user_id
      WHERE a.announcement_id = ${announcementId} AND a.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Announcement not found');
    return this.formatAnnouncement(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0, targetAudience, isPublished } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.user_id
      WHERE a.school_id = ${schoolId}
        ${targetAudience ? sql`AND a.target_audience = ${targetAudience}` : sql``}
        ${isPublished !== undefined ? sql`AND a.is_published = ${isPublished}` : sql``}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM announcements
      WHERE school_id = ${schoolId}
        ${targetAudience ? sql`AND target_audience = ${targetAudience}` : sql``}
        ${isPublished !== undefined ? sql`AND is_published = ${isPublished}` : sql``}
    `;

    return {
      announcements: rows.map(r => this.formatAnnouncement(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async update(schoolId, announcementId, data) {
    await this.getById(schoolId, announcementId);
    const { title, content, targetAudience, priority, isPublished, files } = data;
    let publishedAt = null;
    if (isPublished === true) {
      const current = await sql`SELECT published_at FROM announcements WHERE announcement_id = ${announcementId}`;
      publishedAt = current[0]?.published_at || new Date();
    }
    const filesJson = files ? JSON.stringify(files) : null;
    const rows = await sql`
      UPDATE announcements SET
        title = COALESCE(${title || null}, title),
        content = COALESCE(${content || null}, content),
        target_audience = COALESCE(${targetAudience || null}, target_audience),
        priority = COALESCE(${priority || null}, priority),
        is_published = COALESCE(${isPublished ?? null}, is_published),
        published_at = CASE WHEN ${isPublished} = true AND published_at IS NULL THEN NOW() ELSE published_at END,
        files = COALESCE(${filesJson}::jsonb, files),
        updated_at = NOW()
      WHERE announcement_id = ${announcementId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatAnnouncement(rows[0]);
  }

  async delete(schoolId, announcementId) {
    await this.getById(schoolId, announcementId);
    await sql`DELETE FROM announcements WHERE announcement_id = ${announcementId} AND school_id = ${schoolId}`;
    return { deleted: true, announcementId };
  }

  async publish(schoolId, announcementId) {
    const rows = await sql`
      UPDATE announcements SET is_published = true, published_at = NOW(), updated_at = NOW()
      WHERE announcement_id = ${announcementId} AND school_id = ${schoolId}
      RETURNING *
    `;
    if (rows.length === 0) throw new Error('Announcement not found');
    return this.formatAnnouncement(rows[0]);
  }

  async unpublish(schoolId, announcementId) {
    const rows = await sql`
      UPDATE announcements SET is_published = false, updated_at = NOW()
      WHERE announcement_id = ${announcementId} AND school_id = ${schoolId}
      RETURNING *
    `;
    if (rows.length === 0) throw new Error('Announcement not found');
    return this.formatAnnouncement(rows[0]);
  }
}

module.exports = new AnnouncementService();
