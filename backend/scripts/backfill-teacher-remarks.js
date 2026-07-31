/**
 * Backfill teacher_remarks for EXISTING report card lines.
 *
 * Since auto-remarks are now generated at generation time, bulletins generated
 * BEFORE this feature have NULL teacher_remark and show « En attente
 * d'appréciation ». This script fills them deterministically from the stored
 * subject_average + the report card's education_system_code.
 *
 * Usage:
 *   node scripts/backfill-teacher-remarks.js
 *
 * Safe to re-run (only touches rows where teacher_remark IS NULL and the
 * subject has an average).
 */
require('dotenv').config();
const sql = require('../src/config/database');
const gradingService = require('../src/services/grading.service');

(async () => {
  const rows = await sql`
    SELECT rcl.line_id, rcl.subject_average, rc.education_system_code
    FROM report_card_lines rcl
    JOIN report_cards rc ON rcl.report_card_id = rc.report_card_id
    WHERE rcl.teacher_remark IS NULL
      AND rcl.subject_average IS NOT NULL
  `;

  console.log(`→ ${rows.length} line(s) to backfill…`);

  let updated = 0;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    for (const row of chunk) {
      const remark = gradingService.generateSubjectRemark(row.subject_average, row.education_system_code);
      if (!remark) continue;
      await sql`
        UPDATE report_card_lines
        SET teacher_remark = ${remark}, updated_at = now()
        WHERE line_id = ${row.line_id}
      `;
      updated++;
    }
    console.log(`  …${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  console.log(`✓ ${updated} line(s) updated`);
  await sql.end();
  process.exit(0);
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await sql.end(); } catch { /* ignore */ }
  process.exit(1);
});
