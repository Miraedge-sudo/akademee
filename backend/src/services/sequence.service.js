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

    // ── Validation ──
    if (!label || !label.trim()) {
      throw new Error('Le libellé de la séquence est requis');
    }
    if (!periodeId) {
      throw new Error('La période est requise — une séquence doit être liée à une période');
    }
    if (!dateDebut) {
      throw new Error('La date de début est requise');
    }
    if (!dateFin) {
      throw new Error('La date de fin est requise');
    }
    if (new Date(dateFin) <= new Date(dateDebut)) {
      throw new Error('La date de fin doit être après la date de début');
    }

    // Vérifier que la période existe et appartient à cette école
    const periodExists = await sql`
      SELECT 1 FROM periods WHERE period_id = ${periodeId} AND school_id = ${schoolId}
    `;
    if (periodExists.length === 0) {
      throw new Error('Période introuvable ou ne correspond pas à cette école');
    }

    const maxOrder = await sql`
      SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM sequences WHERE period_id = ${periodeId}
    `;

    const rows = await sql`
      INSERT INTO sequences (school_id, period_id, label, date_debut, date_fin, sort_order)
      VALUES (${schoolId}, ${periodeId}, ${label.trim()}, ${dateDebut}, ${dateFin}, ${maxOrder[0].next_order})
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

    // ── Validation ──
    if (label !== undefined && !label.trim()) {
      throw new Error('Le libellé ne peut pas être vide');
    }
    if (dateDebut && dateFin && new Date(dateFin) <= new Date(dateDebut)) {
      throw new Error('La date de fin doit être après la date de début');
    }

    const rows = await sql`
      UPDATE sequences SET
        label = COALESCE(${label ? label.trim() : null}, label),
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
