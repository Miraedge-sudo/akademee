const sql = require('../config/database');

class SequenceService {
  formatSequence(row) {
    return {
      id: row.sequence_id,
      schoolId: row.school_id,
      periodeId: row.period_id,
      label: row.label,
      dateDebut: row.date_debut,
      dateFin: row.date_fin,
      status: row.status,
      ordre: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(schoolId, data) {
    const { label, periodeId, dateDebut, dateFin } = data;

    const maxOrder = await sql`
      SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM sequences WHERE period_id = ${periodeId}
    `;

    const rows = await sql`
      INSERT INTO sequences (school_id, period_id, label, date_debut, date_fin, sort_order)
      VALUES (${schoolId}, ${periodeId}, ${label}, ${dateDebut || null}, ${dateFin || null}, ${maxOrder[0].next_order})
      RETURNING *
    `;
    return this.formatSequence(rows[0]);
  }

  async getById(schoolId, sequenceId) {
    const rows = await sql`
      SELECT * FROM sequences WHERE sequence_id = ${sequenceId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Sequence not found');
    return this.formatSequence(rows[0]);
  }

  async listBySchool(schoolId) {
    const rows = await sql`
      SELECT s.*, p.label_en AS period_name_en, p.label_fr AS period_name_fr
      FROM sequences s
      JOIN periods p ON s.period_id = p.period_id
      WHERE s.school_id = ${schoolId}
      ORDER BY s.sort_order ASC, s.date_debut ASC
    `;
    return rows.map(r => ({
      ...this.formatSequence(r),
      periodNameEn: r.period_name_en,
      periodNameFr: r.period_name_fr,
    }));
  }

  async listByPeriode(schoolId, periodeId) {
    const rows = await sql`
      SELECT * FROM sequences WHERE school_id = ${schoolId} AND period_id = ${periodeId}
      ORDER BY sort_order ASC, date_debut ASC
    `;
    return rows.map(r => this.formatSequence(r));
  }

  async update(schoolId, sequenceId, data) {
    await this.getById(schoolId, sequenceId);
    const { label, dateDebut, dateFin } = data;
    const rows = await sql`
      UPDATE sequences SET
        label = COALESCE(${label || null}, label),
        date_debut = COALESCE(${dateDebut || null}, date_debut),
        date_fin = COALESCE(${dateFin || null}, date_fin),
        updated_at = now()
      WHERE sequence_id = ${sequenceId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatSequence(rows[0]);
  }

  async updateStatus(schoolId, sequenceId, status) {
    await this.getById(schoolId, sequenceId);

    const validStatuses = ['EN_ATTENTE', 'OUVERTE', 'FERMEE', 'VERROUILLEE'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');

    const rows = await sql`
      UPDATE sequences SET status = ${status}, updated_at = now()
      WHERE sequence_id = ${sequenceId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatSequence(rows[0]);
  }

  async delete(schoolId, sequenceId) {
    await this.getById(schoolId, sequenceId);
    await sql`DELETE FROM sequences WHERE sequence_id = ${sequenceId} AND school_id = ${schoolId}`;
    return { deleted: true, sequenceId };
  }
}

module.exports = new SequenceService();
