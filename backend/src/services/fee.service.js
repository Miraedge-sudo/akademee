const sql = require('../config/database');

class FeeService {
  formatFee(row) {
    return {
      id: row.fee_id,
      schoolId: row.school_id,
      name: row.name,
      amount: Number(row.amount),
      description: row.description,
      classId: row.class_id,
      dueDate: row.due_date || null,
      isArchived: !!row.is_archived,
      createdAt: row.created_at,
    };
  }

  async create(schoolId, data) {
    const { name, amount, classId, description, dueDate } = data;
    const rows = await sql`
      INSERT INTO fees (school_id, name, amount, class_id, description, due_date)
      VALUES (${schoolId}, ${name}, ${amount}, ${classId || null}, ${description || null}, ${dueDate || null})
      RETURNING *
    `;
    return this.formatFee(rows[0]);
  }

  async getById(schoolId, feeId) {
    const rows = await sql`
      SELECT * FROM fees WHERE fee_id = ${feeId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Fee not found');
    return this.formatFee(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0, includeArchived = false } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    // Par défaut, les frais archivés n'apparaissent plus dans les listes
    // (page Frais, modale d'assignation, page d'assignation).
    const archivedFilter = includeArchived ? sql`` : sql`AND is_archived = false`;

    const rows = await sql`
      SELECT * FROM fees WHERE school_id = ${schoolId}
        ${archivedFilter}
      ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM fees WHERE school_id = ${schoolId}
        ${archivedFilter}
    `;

    return {
      fees: rows.map(r => this.formatFee(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async update(schoolId, feeId, data) {
    await this.getById(schoolId, feeId);
    const { name, amount, classId, description, dueDate } = data;
    const rows = await sql`
      UPDATE fees SET
        name = COALESCE(${name || null}, name),
        amount = COALESCE(${amount ?? null}, amount),
        class_id = COALESCE(${classId || null}, class_id),
        description = COALESCE(${description || null}, description),
        due_date = COALESCE(${dueDate || null}, due_date)
      WHERE fee_id = ${feeId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatFee(rows[0]);
  }

  /**
   * Vérifie si un frais a été payé (student_fees.amount_paid > 0 OU un
   * paiement lié dans payments). Un frais payé ne peut PAS être supprimé :
   * on ne détruit jamais l'historique des paiements. L'admin doit l'archiver.
   */
  async hasPayments(schoolId, feeId) {
    const rows = await sql`
      (SELECT 1 FROM student_fees
       WHERE fee_id = ${feeId} AND school_id = ${schoolId} AND amount_paid > 0
       LIMIT 1)
      UNION
      (SELECT 1 FROM payments
       WHERE fee_id = ${feeId} AND school_id = ${schoolId}
       LIMIT 1)
    `;
    return rows.length > 0;
  }

  async delete(schoolId, feeId) {
    await this.getById(schoolId, feeId);

    if (await this.hasPayments(schoolId, feeId)) {
      throw new Error('Fee has payments and cannot be deleted. Archive it instead.');
    }

    await sql`DELETE FROM fees WHERE fee_id = ${feeId} AND school_id = ${schoolId}`;
    return { deleted: true, feeId };
  }

  async archive(schoolId, feeId) {
    await this.getById(schoolId, feeId);
    const rows = await sql`
      UPDATE fees SET is_archived = true
      WHERE fee_id = ${feeId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatFee(rows[0]);
  }

  async unarchive(schoolId, feeId) {
    await this.getById(schoolId, feeId);
    const rows = await sql`
      UPDATE fees SET is_archived = false
      WHERE fee_id = ${feeId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatFee(rows[0]);
  }
}

module.exports = new FeeService();
