const sql = require('../config/database');

class PeriodService {
  formatPeriod(row) {
    return {
      id: row.period_id,
      schoolId: row.school_id,
      academicYearId: row.academic_year_id,
      name: row.name,
      type: row.type,
      startDate: row.start_date,
      endDate: row.end_date,
      isCurrent: row.is_current,
      sortOrder: row.sort_order,
    };
  }

  async create(schoolId, data) {
    const { academicYearId, name, type, startDate, endDate, sortOrder } = data;

    if (academicYearId) {
      const yearExists = await sql`
        SELECT 1 FROM academic_years WHERE academic_year_id = ${academicYearId} AND school_id = ${schoolId}
      `;
      if (yearExists.length === 0) {
        throw new Error('Academic year not found or does not belong to this school');
      }
    }

    const rows = await sql`
      INSERT INTO periods (school_id, academic_year_id, name, type, start_date, end_date, sort_order)
      VALUES (${schoolId}, ${academicYearId}, ${name}, ${type || 'term'}, ${startDate || null}, ${endDate || null}, ${sortOrder || 0})
      RETURNING *
    `;
    return this.formatPeriod(rows[0]);
  }

  async getById(schoolId, periodId) {
    const rows = await sql`
      SELECT * FROM periods WHERE period_id = ${periodId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Period not found');
    return this.formatPeriod(rows[0]);
  }

  async listBySchool(schoolId, { academicYearId, limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT * FROM periods
      WHERE school_id = ${schoolId}
        ${academicYearId ? sql`AND academic_year_id = ${academicYearId}` : sql``}
      ORDER BY sort_order ASC, start_date ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM periods WHERE school_id = ${schoolId}
        ${academicYearId ? sql`AND academic_year_id = ${academicYearId}` : sql``}
    `;

    return {
      periods: rows.map(r => this.formatPeriod(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async update(schoolId, periodId, data) {
    await this.getById(schoolId, periodId);
    const { name, type, startDate, endDate, isCurrent, sortOrder } = data;

    if (isCurrent) {
      await sql`UPDATE periods SET is_current = false WHERE school_id = ${schoolId}`;
    }

    const rows = await sql`
      UPDATE periods SET
        name = COALESCE(${name || null}, name),
        type = COALESCE(${type || null}, type),
        start_date = COALESCE(${startDate || null}, start_date),
        end_date = COALESCE(${endDate || null}, end_date),
        is_current = COALESCE(${isCurrent ?? null}, is_current),
        sort_order = COALESCE(${sortOrder ?? null}, sort_order)
      WHERE period_id = ${periodId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatPeriod(rows[0]);
  }

  async delete(schoolId, periodId) {
    await this.getById(schoolId, periodId);
    await sql`DELETE FROM periods WHERE period_id = ${periodId} AND school_id = ${schoolId}`;
    return { deleted: true, periodId };
  }
}

module.exports = new PeriodService();
