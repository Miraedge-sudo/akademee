/**
 * Quick diagnostic: inspect the latest report card + its lines.
 * Usage: node scripts/check-report-card-data.js
 */
require('dotenv').config();
const sql = require('../src/config/database');

(async () => {
  const rc = await sql`
    SELECT report_card_id, general_average, class_rank, class_size, mention, status,
           period_structure_id, sequence_id
    FROM report_cards
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!rc.length) {
    console.log('NO_REPORT_CARD');
    await sql.end();
    return;
  }
  const r = rc[0];
  console.log('LATEST CARD:', JSON.stringify({
    avg: r.general_average,
    rank: r.class_rank,
    classSize: r.class_size,
    mention: r.mention,
    status: r.status,
    isSequence: !!r.sequence_id,
  }));

  const lines = await sql`
    SELECT subject_id, subject_average, coefficient, subject_rank
    FROM report_card_lines
    WHERE report_card_id = ${r.report_card_id}
  `;
  console.log('LINES:', lines.length, '→', lines.map((l) => ({
    avg: l.subject_average,
    coef: l.coefficient,
    rank: l.subject_rank,
  })));

  // Sanity check: recompute the weighted average from the lines
  const weightedSum = lines.reduce((s, l) => s + (l.subject_average != null ? Number(l.subject_average) * Number(l.coefficient) : 0), 0);
  const coefSum = lines.reduce((s, l) => s + Number(l.coefficient), 0);
  const recomputed = coefSum > 0 ? weightedSum / coefSum : null;
  console.log('RECOMPUTED AVG:', recomputed != null ? Number(recomputed.toFixed(2)) : null);
  console.log('MATCHES stored avg:', recomputed != null && Math.abs(recomputed - Number(r.general_average)) < 0.011 ? 'YES' : 'NO');

  await sql.end();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
