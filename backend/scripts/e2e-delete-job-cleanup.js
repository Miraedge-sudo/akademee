/**
 * E2E test: deleting a report card must purge its references from
 * report_card_jobs.results and remove terminal jobs whose cards are all gone.
 *
 * Creates two synthetic COMPLETED jobs referencing a real report card:
 *  - Job A: references ONLY the deleted card  → must be deleted entirely
 *  - Job B: references the deleted card + another card → must survive with
 *           the dead reference removed
 */
require('dotenv').config();
const sql = require('postgres')(process.env.DATABASE_URL, { connect_timeout: 10 });
const gradingService = require('../src/services/grading.service');

(async () => {
  const cards = await sql`SELECT report_card_id FROM report_cards LIMIT 1`;
  if (!cards.length) {
    console.error('NO_CARDS — skipping (nothing to delete)');
    await sql.end();
    process.exit(0);
  }
  const cardId = cards[0].report_card_id;
  const other = await sql`
    SELECT report_card_id FROM report_cards
    WHERE report_card_id <> ${cardId} LIMIT 1
  `;
  const otherId = other.length
    ? other[0].report_card_id
    : '00000000-0000-0000-0000-000000000099';

  const [school] = await sql`SELECT school_id FROM schools LIMIT 1`;
  const schoolId = school.school_id;

  // Synthetic jobs referencing the card we are about to delete
  const [jobA] = await sql`
    INSERT INTO report_card_jobs
      (school_id, class_level_id, period_structure_id, status, total_students, results)
    VALUES
      (${schoolId}, ${cardId}, ${cardId}, 'COMPLETED', 1,
       ${JSON.stringify([{ studentId: 'test', reportCardId: cardId, success: true }])}::jsonb)
    RETURNING job_id
  `;
  const [jobB] = await sql`
    INSERT INTO report_card_jobs
      (school_id, class_level_id, period_structure_id, status, total_students, results)
    VALUES
      (${schoolId}, ${cardId}, ${cardId}, 'COMPLETED', 2,
       ${JSON.stringify([
         { studentId: 'test', reportCardId: cardId, success: true },
         { studentId: 'test2', reportCardId: otherId, success: true },
       ])}::jsonb)
    RETURNING job_id
  `;

  // Act: delete the real card through the service (exercises the cleanup path)
  await gradingService.deleteReportCard(cardId, null);

  // Assert
  const aAfter = await sql`SELECT * FROM report_card_jobs WHERE job_id = ${jobA.job_id}`;
  const bAfter = await sql`SELECT * FROM report_card_jobs WHERE job_id = ${jobB.job_id}`;
  const cardAfter = await sql`SELECT * FROM report_cards WHERE report_card_id = ${cardId}`;

  // postgres.js may return jsonb as a raw string — normalize for assertions
  const parseResults = (row) => {
    if (!row) return [];
    if (Array.isArray(row.results)) return row.results;
    try { return JSON.parse(row.results); } catch { return []; }
  };
  const bResults = parseResults(bAfter[0]);

  const bRefs = bAfter.length ? bResults.filter((r) => r.reportCardId === cardId).length : -1;
  const bKeepsOther = bAfter.length ? bResults.some((r) => r.reportCardId === otherId) : false;

  console.error('JOB A (single-card)  →', aAfter.length === 0 ? 'DELETED ✓' : `STILL EXISTS ✗ (${aAfter.length})`);
  console.error('JOB B (multi-card)   →', bAfter.length === 1 && bRefs === 0 && bKeepsOther ? 'SURVIVED, ref purged ✓' : `BAD ✗ (rows=${bAfter.length}, refs=${bRefs}, keepsOther=${bKeepsOther})`);
  console.error('CARD deleted         →', cardAfter.length === 0 ? 'YES ✓' : 'NO ✗');

  // Cleanup synthetic job B
  if (bAfter.length) await sql`DELETE FROM report_card_jobs WHERE job_id = ${jobB.job_id}`;

  const ok = aAfter.length === 0 && bAfter.length === 1 && bRefs === 0 && bKeepsOther && cardAfter.length === 0;
  await sql.end();
  console.error(ok ? 'OK' : 'FAILED');
  process.exit(ok ? 0 : 1);
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await sql.end(); } catch { /* ignore */ }
  process.exit(1);
});
