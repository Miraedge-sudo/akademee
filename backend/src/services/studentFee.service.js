const sql = require('../config/database');
const notificationService = require('./notification.service');

class StudentFeeService {
  formatStudentFee(row) {
    return {
      id: row.student_fee_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      feeId: row.fee_id,
      feeName: row.fee_name,
      amountDue: Number(row.amount_due),
      amountPaid: Number(row.amount_paid),
      status: row.status,
      dueDate: row.due_date || null,
      academicYearId: row.academic_year_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Résout l'année académique d'une assignation : celle explicitement fournie,
   * sinon l'année active (is_current), sinon la plus récente. Évite de créer
   * des assignations avec academic_year_id NULL qui disparaissent ensuite des
   * vues filtrées par année (ex: la page d'assignation par classe).
   */
  async resolveActiveYear(schoolId, academicYearId) {
    if (academicYearId) return academicYearId;
    const [row] = await sql`
      SELECT academic_year_id
      FROM academic_years
      WHERE school_id = ${schoolId}
      ORDER BY is_current DESC, start_date DESC NULLS LAST
      LIMIT 1
    `;
    return row?.academic_year_id || null;
  }

  async assignFeesToStudent(schoolId, studentId, feeIds, academicYearId) {
    if (!feeIds || feeIds.length === 0) return [];

    academicYearId = await this.resolveActiveYear(schoolId, academicYearId);

    const yearFilter = academicYearId
      ? sql`sf.academic_year_id = ${academicYearId}`
      : sql`sf.academic_year_id IS NULL`;

    const rows = await sql`
      WITH valid_fees AS (
        SELECT fee_id, amount FROM fees
        WHERE fee_id = ANY(${feeIds}) AND school_id = ${schoolId}
      ),
      new_rows AS (
        INSERT INTO student_fees (school_id, student_id, fee_id, amount_due, academic_year_id)
        SELECT ${schoolId}, ${studentId}, vf.fee_id, COALESCE(vf.amount, 0), ${academicYearId || null}
        FROM valid_fees vf
        WHERE NOT EXISTS (
          SELECT 1 FROM student_fees sf
          WHERE sf.student_id = ${studentId}
            AND sf.fee_id = vf.fee_id
            AND ${yearFilter}
        )
        RETURNING *
      ),
      existing AS (
        SELECT sf.* FROM student_fees sf
        WHERE sf.student_id = ${studentId}
          AND sf.fee_id IN (SELECT fee_id FROM valid_fees)
          AND ${yearFilter}
      )
      SELECT * FROM new_rows
      UNION ALL
      SELECT * FROM existing
    `;
    const assigned = rows.map(r => this.formatStudentFee(r));

    // ── Notification : frais assignés à un élève ──
    if (assigned.length > 0) {
      try {
        const [stu] = await sql`
          SELECT u.user_id FROM students s
          JOIN users u ON u.user_id = s.user_id
          WHERE s.student_id = ${studentId} AND s.school_id = ${schoolId}
        `;
        const feeRows = await sql`
          SELECT name FROM fees WHERE fee_id = ANY(${feeIds}) AND school_id = ${schoolId}
        `;
        const feeNames = feeRows.map(f => f.name).join(', ');
        const message = feeNames
          ? `Des frais vous ont été assignés : ${feeNames}. Consultez votre page Frais pour plus de détails.`
          : `Des frais vous ont été assignés. Consultez votre page Frais pour plus de détails.`;
        const messageEn = feeNames
          ? `Fees have been assigned to you: ${feeNames}. Check your Fees page for more details.`
          : `Fees have been assigned to you. Check your Fees page for more details.`;
        if (stu?.user_id) {
          await notificationService.sendBroadcast(schoolId, {
            audience: 'user',
            userId: stu.user_id,
            type: 'payment',
            message,
            messageEn,
          });
        }
      } catch {
        // ignore — l'assignation reste valide
      }
    }

    return assigned;
  }

  /**
   * Assigne des frais à une classe. Mode additif par défaut (ajoute les frais
   * manquants, ne touche pas au reste). Avec `replace: true` (page
   * d'assignation /dashboard/fees/assign), la liste envoyée devient la liste
   * complète voulue : les frais décochés sont retirés de la classe — sauf s'ils
   * ont déjà été payés (on ne supprime jamais un paiement).
   */
  async assignFeesToClass(schoolId, classId, feeIds, academicYearId, { replace = false } = {}) {
    const list = Array.isArray(feeIds) ? feeIds.filter(Boolean) : [];
    academicYearId = await this.resolveActiveYear(schoolId, academicYearId);

    // ── Mode remplacement : retire les frais décochés (non payés) ──
    if (replace) {
      const yearClause = academicYearId
        ? sql`AND (sf.academic_year_id = ${academicYearId} OR sf.academic_year_id IS NULL)`
        : sql``;
      const feeClause = list.length > 0
        ? sql`AND sf.fee_id <> ALL(${list})`
        : sql``;
      await sql`
        DELETE FROM student_fees sf
        USING enrollments e
        WHERE sf.student_id = e.student_id
          AND e.class_id = ${classId}
          AND e.school_id = ${schoolId}
          AND e.status = 'active'
          AND sf.school_id = ${schoolId}
          AND sf.amount_paid = 0
          ${yearClause}
          ${feeClause}
      `;
      if (list.length === 0) return [];
    }

    if (list.length === 0) return [];

    // L'assignation existante (année précise OU sans année, héritée) bloque le
    // doublon : un frais déjà posé sur la classe ne se réinsère pas.
    const yearFilter = academicYearId
      ? sql`(sf.academic_year_id = ${academicYearId} OR sf.academic_year_id IS NULL)`
      : sql`sf.academic_year_id IS NULL`;

    const rows = await sql`
      WITH class_students AS (
        SELECT DISTINCT student_id FROM enrollments
        WHERE class_id = ${classId} AND school_id = ${schoolId} AND status = 'active'
      ),
      valid_fees AS (
        SELECT fee_id, amount FROM fees
        WHERE fee_id = ANY(${list}) AND school_id = ${schoolId}
      ),
      new_rows AS (
        INSERT INTO student_fees (school_id, student_id, fee_id, amount_due, academic_year_id)
        SELECT ${schoolId}, cs.student_id, vf.fee_id, COALESCE(vf.amount, 0), ${academicYearId || null}
        FROM class_students cs
        CROSS JOIN valid_fees vf
        WHERE NOT EXISTS (
          SELECT 1 FROM student_fees sf
          WHERE sf.student_id = cs.student_id
            AND sf.fee_id = vf.fee_id
            AND ${yearFilter}
        )
        RETURNING *, true AS is_new
      ),
      existing AS (
        SELECT sf.*, false AS is_new FROM student_fees sf
        WHERE sf.student_id IN (SELECT student_id FROM class_students)
          AND sf.fee_id IN (SELECT fee_id FROM valid_fees)
          AND ${yearFilter}
      )
      SELECT * FROM new_rows
      UNION ALL
      SELECT * FROM existing
    `;
    const assigned = rows.map(r => this.formatStudentFee(r));

    // ── Notification : frais assignés à une classe ──
    // Prévient les élèves de la classe + leurs parents (tuteurs) UNIQUEMENT
    // quand de nouvelles assignations ont été créées (pas à chaque enregistrement
    // de la page, qui renvoie aussi les frais déjà existants).
    // Une erreur de notification ne doit jamais faire échouer l'assignation.
    const isNew = (r) => r.is_new === true;
    if (rows.some(isNew)) {
      try {
        const [klass] = await sql`
          SELECT name FROM classes WHERE class_id = ${classId} AND school_id = ${schoolId}
        `;
        const newFeeIds = [...new Set(rows.filter(isNew).map(r => r.fee_id))];
        const feeRows = await sql`
          SELECT name FROM fees WHERE fee_id = ANY(${newFeeIds.length > 0 ? newFeeIds : list}) AND school_id = ${schoolId}
        `;
        const feeNames = feeRows.map(f => f.name).join(', ');
        const message = feeNames
          ? `Des frais ont été assignés à votre classe (${klass?.name || '—'}) : ${feeNames}. Consultez votre page Frais pour plus de détails.`
          : `Des frais ont été assignés à votre classe (${klass?.name || '—'}). Consultez votre page Frais pour plus de détails.`;
        const messageEn = feeNames
          ? `Fees have been assigned to your class (${klass?.name || '—'}): ${feeNames}. Check your Fees page for more details.`
          : `Fees have been assigned to your class (${klass?.name || '—'}). Check your Fees page for more details.`;
        await notificationService.sendBroadcast(schoolId, {
          audience: 'class',
          classId,
          type: 'payment',
          message,
          messageEn,
        });
      } catch {
        // ignore — l'assignation reste valide
      }
    }

    return assigned;
  }

  async listByClass(schoolId, classId, academicYearId) {
    // Les assignations sans année (academic_year_id NULL — créées avant la
    // résolution automatique d'année) restent visibles : on les inclut quand un
    // filtre année est actif. EXCEPTION : une assignation NULL-year déjà payée
    // est un reliquat d'une année passée — on ne la remonte pas dans la vue de
    // l'année courante (sinon un frais retiré « réapparaît » après actualisation
    // et l'admin ne peut jamais l'enlever). Le paiement, lui, reste intact dans
    // la table payments et dans la vue élève (getStudentFeeSummary).
    const yearFilter = academicYearId
      ? sql`AND (sf.academic_year_id = ${academicYearId} OR (sf.academic_year_id IS NULL AND sf.amount_paid = 0))`
      : sql``;

    const rows = await sql`
      SELECT DISTINCT sf.fee_id, f.name AS fee_name, f.amount
      FROM student_fees sf
      JOIN fees f ON sf.fee_id = f.fee_id
      JOIN enrollments e ON sf.student_id = e.student_id AND e.class_id = ${classId} AND e.school_id = ${schoolId} AND e.status = 'active'
      WHERE sf.school_id = ${schoolId}
        ${yearFilter}
      ORDER BY f.name ASC
    `;
    return rows.map(r => ({
      feeId: r.fee_id,
      feeName: r.fee_name,
      amount: Number(r.amount),
    }));
  }

  async listByStudent(schoolId, studentId) {
    const rows = await sql`
      SELECT sf.*, f.name AS fee_name, f.due_date
      FROM student_fees sf
      JOIN fees f ON sf.fee_id = f.fee_id
      WHERE sf.student_id = ${studentId} AND sf.school_id = ${schoolId}
      ORDER BY sf.created_at DESC
    `;
    return rows.map(r => this.formatStudentFee(r));
  }

  async getSummary(schoolId, studentId) {
    const fees = await sql`
      SELECT COALESCE(SUM(amount_due), 0)::numeric AS total_due,
             COALESCE(SUM(amount_paid), 0)::numeric AS total_paid
      FROM student_fees
      WHERE student_id = ${studentId} AND school_id = ${schoolId}
    `;
    const totalDue = Number(fees[0]?.total_due || 0);
    const totalPaid = Number(fees[0]?.total_paid || 0);

    let status = 'pending';
    if (totalDue === 0) status = 'none';
    else if (totalPaid >= totalDue) status = 'paid';
    else if (totalPaid > 0) status = 'partial';

    return { totalDue, totalPaid, balance: totalDue - totalPaid, status };
  }

  async updatePayment(schoolId, studentId, feeId, amount, academicYearId) {
    // Dynamic WHERE: if academicYearId is omitted, we don't filter by it.
    // The standard codebase pattern is inline ternary — NOT sql.join().
    const rows = await sql`
      UPDATE student_fees SET
        amount_paid = amount_paid + ${amount},
        status = CASE WHEN (amount_paid + ${amount}) >= amount_due THEN 'paid' ELSE 'partial' END,
        updated_at = NOW()
      WHERE student_id = ${studentId}
        AND school_id = ${schoolId}
        ${feeId ? sql`AND fee_id = ${feeId}` : sql``}
        ${academicYearId ? sql`AND academic_year_id = ${academicYearId}` : sql``}
      RETURNING *
    `;

    return rows.length > 0 ? this.formatStudentFee(rows[0]) : null;
  }
}

module.exports = new StudentFeeService();
