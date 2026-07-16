const sql = require('../config/database');

class SeriesService {
  formatSeries(row) {
    return {
      id: row.series_id,
      schoolId: row.school_id,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async create(schoolId, data) {
    const { name } = data;
    const rows = await sql`
      INSERT INTO system_series (school_id, name)
      VALUES (${schoolId}, ${name})
      RETURNING *
    `;
    return this.formatSeries(rows[0]);
  }

  async getById(schoolId, seriesId) {
    const rows = await sql`
      SELECT * FROM system_series WHERE series_id = ${seriesId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Series not found');
    return this.formatSeries(rows[0]);
  }

  async listBySchool(schoolId) {
    const rows = await sql`
      SELECT * FROM system_series WHERE school_id = ${schoolId} ORDER BY name ASC
    `;
    return rows.map(r => this.formatSeries(r));
  }

  async update(schoolId, seriesId, data) {
    await this.getById(schoolId, seriesId);
    const { name } = data;
    const rows = await sql`
      UPDATE system_series SET name = COALESCE(${name || null}, name)
      WHERE series_id = ${seriesId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatSeries(rows[0]);
  }

  async delete(schoolId, seriesId) {
    await this.getById(schoolId, seriesId);
    await sql`DELETE FROM system_series WHERE series_id = ${seriesId} AND school_id = ${schoolId}`;
    return { deleted: true, seriesId };
  }
}

module.exports = new SeriesService();
