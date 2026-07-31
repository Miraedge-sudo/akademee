/**
 * E2E test: verify
 *  1. generateSubjectRemark returns the expected wording per average + system
 *  2. generateReportCardsZip produces a valid ZIP with one entry per student,
 *     organized as ClassName/StudentName.pdf
 */
require('dotenv').config();
const sql = require('postgres')(process.env.DATABASE_URL, { connect_timeout: 10 });
const pdfSvc = require('../src/services/reportCardPdf.service');
const gradingSvc = require('../src/services/grading.service');

(async () => {
  // 1. Remark generator
  const rHigh = gradingSvc.generateSubjectRemark(17.5, 'FR_GEN');
  const rGood = gradingSvc.generateSubjectRemark(14.2, 'ANG_GEN');
  const rLow = gradingSvc.generateSubjectRemark(7, 'FR_GEN');
  const rNone = gradingSvc.generateSubjectRemark(null, 'FR_GEN');
  console.error('REMARK FR 17.5:', rHigh);
  console.error('REMARK EN 14.2:', rGood);
  console.error('REMARK FR 7:', rLow);
  console.error('REMARK null:', rNone === null ? 'null ✓' : String(rNone));

  // 2. ZIP export
  const cards = await gradingSvc.listReportCards({});
  if (!cards.length) {
    console.error('NO_CARDS — skipping ZIP part');
    await sql.end();
    const okRemarks = rHigh === 'Excellent' && rGood === 'Good' && rLow === 'Faible' && rNone === null;
    console.error(okRemarks ? 'OK' : 'FAILED');
    process.exit(okRemarks ? 0 : 1);
  }

  const payloads = [];
  for (const c of cards.slice(0, 3)) {
    try {
      payloads.push(await gradingSvc.getReportCardPayload(c.report_card_id, 'EN'));
    } catch (e) {
      console.error('skip card', c.report_card_id, e.message);
    }
  }
  if (!payloads.length) {
    console.error('NO_PAYLOADS');
    await sql.end();
    process.exit(1);
  }

  const zip = await pdfSvc.generateReportCardsZip(payloads);
  const magic = zip.slice(0, 2).toString('ascii');

  const found = payloads.filter((p) => {
    const cls = (p.student?.class_name || 'No class').replace(/[/\\:*?"<>|]/g, '-').trim();
    const name = (p.student?.full_name || 'student').replace(/[/\\:*?"<>|]/g, '-').trim();
    return zip.includes(Buffer.from(`${cls}/${name}.pdf`, 'utf8'));
  }).length;

  console.error('ZIP size:', zip.length, '| magic:', magic, '| payloads:', payloads.length, '| entries found:', found);

  await pdfSvc.closeBrowser();
  await sql.end();

  const ok = magic === 'PK' && found === payloads.length &&
    rHigh === 'Excellent' && rGood === 'Good' && rLow === 'Faible' && rNone === null;
  console.error(ok ? 'OK' : 'FAILED');
  process.exit(ok ? 0 : 1);
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  try { await sql.end(); } catch { /* ignore */ }
  process.exit(1);
});
