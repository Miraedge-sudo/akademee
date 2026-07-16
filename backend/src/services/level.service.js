const sql = require('../config/database');

class LevelService {
  formatLevel(row) {
    return {
      id: row.level_id,
      schoolId: row.school_id,
      name: row.name,
      order: row.sort_order,
      createdAt: row.created_at,
    };
  }

  async create(schoolId, data) {
    const { name, order } = data;
    const rows = await sql`
      INSERT INTO system_levels (school_id, name, sort_order)
      VALUES (${schoolId}, ${name}, ${order ?? 0})
      RETURNING *
    `;
    return this.formatLevel(rows[0]);
  }

  async getById(schoolId, levelId) {
    const rows = await sql`
      SELECT * FROM system_levels WHERE level_id = ${levelId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Level not found');
    return this.formatLevel(rows[0]);
  }

  async listBySchool(schoolId) {
    const rows = await sql`
      SELECT * FROM system_levels WHERE school_id = ${schoolId} ORDER BY sort_order ASC
    `;
    return rows.map(r => this.formatLevel(r));
  }

  async update(schoolId, levelId, data) {
    await this.getById(schoolId, levelId);
    const { name, order } = data;
    const rows = await sql`
      UPDATE system_levels SET
        name = COALESCE(${name || null}, name),
        sort_order = COALESCE(${order ?? null}, sort_order)
      WHERE level_id = ${levelId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatLevel(rows[0]);
  }

  async delete(schoolId, levelId) {
    await this.getById(schoolId, levelId);
    await sql`DELETE FROM system_levels WHERE level_id = ${levelId} AND school_id = ${schoolId}`;
    return { deleted: true, levelId };
  }
}

module.exports = new LevelService();
