/**
 * FinancialStatementService — "Financial state of the campus" PDF generator.
 *
 * Aggregates the school's financial health (totals, monthly collections,
 * per-class collection, fee status, top outstanding balances) and renders a
 * clean, professional A4 PDF with pdfkit. Intended for the accountant to
 * print / download and hand over to the school administration.
 *
 * Route: GET /api/reports/financial-statement/pdf (admin + accountant)
 *
 * Scope: when an active academic year exists, ALL figures (collected,
 * outstanding, per-class, top balances) are aligned to that year so the
 * document's rates stay internally consistent. Without an active year the
 * report falls back to all-time data.
 */

const sql = require('../config/database');
const PDFDocument = require('pdfkit');

const FALLBACK_COLOR = '#085041';

// ── Color helpers (pdfkit does not reliably support rgba(), so we mix
//    with white to produce light tints instead). ──
function safeHex(color, fallback = FALLBACK_COLOR) {
  if (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
  if (typeof color === 'string' && /^[0-9a-fA-F]{6}$/.test(color)) return `#${color.toLowerCase()}`;
  return fallback;
}

function mixWithWhite(hex, whitePct) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const w = Math.min(Math.max(whitePct, 0), 100) / 100;
  const to = (v) => Math.round(v + (255 - v) * w).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// ── Formatting helpers ──
function fmtMoney(n) {
  // en-US grouping with plain spaces: the narrow no-break space used by
  // fr-FR is not representable in the WinAnsi fonts pdfkit ships with.
  const value = Number(n || 0);
  return `${value.toLocaleString('en-US').replace(/,/g, ' ')} FCFA`;
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

class FinancialStatementService {
  /**
   * Aggregate every number that appears in the PDF.
   */
  async getData(schoolId) {
    const [schoolRows, yearRows] = await Promise.all([
      sql`
        SELECT name, subdomain, city, region, email, phone, primary_color, logo_url, tagline
        FROM schools WHERE school_id = ${schoolId}
      `,
      sql`
        SELECT academic_year_id, name, start_date, end_date
        FROM academic_years
        WHERE school_id = ${schoolId} AND is_current = true
        LIMIT 1
      `,
    ]);

    const school = schoolRows[0] || null;
    const year = yearRows[0] || null;
    // Payments + student_fees are both scoped to the active year when present.
    const yearFilter = year ? sql`AND p.academic_year_id = ${year.academic_year_id}` : sql``;
    const feeYearJoin = year ? sql`AND sf.academic_year_id = ${year.academic_year_id}` : sql``;
    const feeYearWhere = year ? sql`AND academic_year_id = ${year.academic_year_id}` : sql``;

    const [totals, monthly, byClass, feeStatus, students, classes, outstandingTotal, topBalances] =
      await Promise.all([
        // 1. Overall collected + payment count (active year / all time)
        sql`
          SELECT COALESCE(SUM(p.amount), 0)::numeric AS total, COUNT(*)::int AS count
          FROM payments p
          WHERE p.school_id = ${schoolId} AND p.status = 'completed'
            ${yearFilter}
        `,
        // 2. Monthly collections (last 7 months)
        sql`
          SELECT TO_CHAR(DATE_TRUNC('month', p.created_at), 'Mon') AS month_label,
                 EXTRACT(MONTH FROM p.created_at)::int AS month_num,
                 EXTRACT(YEAR FROM p.created_at)::int AS year,
                 COALESCE(SUM(p.amount), 0)::numeric AS total
          FROM payments p
          WHERE p.school_id = ${schoolId}
            AND p.status = 'completed'
            AND p.created_at >= NOW() - INTERVAL '7 months'
            ${yearFilter}
          GROUP BY DATE_TRUNC('month', p.created_at),
                   EXTRACT(MONTH FROM p.created_at),
                   EXTRACT(YEAR FROM p.created_at)
          ORDER BY year ASC, month_num ASC
        `,
        // 3. Collection per class (fees due vs paid, both year-aligned)
        sql`
          SELECT c.name AS class_name,
                 COALESCE(SUM(sf.amount_due), 0)::numeric AS total_fees,
                 COALESCE(SUM(p.amount), 0)::numeric AS total_paid
          FROM classes c
          LEFT JOIN enrollments e ON c.class_id = e.class_id AND e.status = 'active'
          LEFT JOIN student_fees sf ON e.student_id = sf.student_id
            ${feeYearJoin}
          LEFT JOIN payments p ON e.student_id = p.student_id AND p.status = 'completed'
            ${yearFilter}
          WHERE c.school_id = ${schoolId}
          GROUP BY c.class_id, c.name
          HAVING COALESCE(SUM(sf.amount_due), 0) > 0
          ORDER BY c.name ASC
        `,
        // 4. Fee status overview (active students — current snapshot)
        sql`
          SELECT
            COALESCE(SUM(CASE WHEN fee_status = 'paid' THEN 1 ELSE 0 END), 0)::int AS paid,
            COALESCE(SUM(CASE WHEN fee_status = 'partial' THEN 1 ELSE 0 END), 0)::int AS partial,
            COALESCE(SUM(CASE WHEN fee_status IN ('pending', 'unpaid') THEN 1 ELSE 0 END), 0)::int AS unpaid
          FROM students
          WHERE school_id = ${schoolId} AND status = 'active'
        `,
        // 5. Counts
        sql`SELECT COUNT(*)::int AS total FROM students WHERE school_id = ${schoolId} AND status = 'active'`,
        sql`SELECT COUNT(*)::int AS total FROM classes WHERE school_id = ${schoolId}`,
        // 6. Total outstanding balance (positive balances only, year-aligned)
        sql`
          SELECT COALESCE(SUM(GREATEST(amount_due - amount_paid, 0)), 0)::numeric AS total
          FROM student_fees
          WHERE school_id = ${schoolId}
            ${feeYearWhere}
        `,
        // 7. Top outstanding balances (year-aligned, for the defaulters table)
        sql`
          SELECT sf.student_id,
                 CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                 COALESCE(c.name, 'N/A') AS class_name,
                 COALESCE(SUM(sf.amount_due - sf.amount_paid), 0)::numeric AS balance
          FROM student_fees sf
          JOIN students st ON sf.student_id = st.student_id
          LEFT JOIN users u ON st.user_id = u.user_id
          LEFT JOIN enrollments e ON st.student_id = e.student_id AND e.status = 'active'
          LEFT JOIN classes c ON e.class_id = c.class_id
          WHERE sf.school_id = ${schoolId} AND st.status = 'active'
            ${feeYearJoin}
          GROUP BY sf.student_id, u.first_name, u.last_name, c.name
          HAVING COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) > 0
          ORDER BY balance DESC
          LIMIT 8
        `,
      ]);

    const totalCollected = Number(totals[0]?.total ?? 0);
    const paymentCount = totals[0]?.count ?? 0;
    const outstanding = Number(outstandingTotal[0]?.total ?? 0);
    const collectionRate =
      totalCollected + outstanding > 0
        ? Math.round((totalCollected / (totalCollected + outstanding)) * 100)
        : 0;

    return {
      school: school
        ? {
            name: school.name || 'School',
            subdomain: school.subdomain || '',
            city: school.city || '',
            region: school.region || '',
            email: school.email || '',
            phone: school.phone || '',
            tagline: school.tagline || '',
            primaryColor: safeHex(school.primary_color),
          }
        : null,
      year: year ? { name: year.name || 'Current year' } : null,
      totalCollected,
      paymentCount,
      outstanding,
      collectionRate,
      monthlyCollections: monthly.map((r) => ({ month: r.month_label, total: Number(r.total) })),
      collectionByClass: byClass.map((r) => ({
        name: r.class_name,
        totalFees: Number(r.total_fees),
        totalPaid: Number(r.total_paid),
      })),
      feeStatusOverview: {
        paid: Number(feeStatus[0]?.paid ?? 0),
        partial: Number(feeStatus[0]?.partial ?? 0),
        unpaid: Number(feeStatus[0]?.unpaid ?? 0),
      },
      totalStudents: students[0]?.total ?? 0,
      totalClasses: classes[0]?.total ?? 0,
      topBalances: topBalances.map((r) => ({
        name: r.student_name,
        className: r.class_name,
        balance: Number(r.balance),
      })),
    };
  }

  /**
   * Generate the PDF buffer.
   * @param {string} schoolId
   * @param {{ lang?: 'fr'|'en' }} [opts]
   * @returns {Promise<Buffer>}
   */
  async generatePdf(schoolId, { lang = 'fr' } = {}) {
    const data = await this.getData(schoolId);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 46, size: 'A4', bufferPages: true });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.render(doc, data, lang === 'fr' ? 'fr' : 'en');

        // Stamp footer on every page once content is laid out.
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .fillColor('#9CA3AF')
            .text(
              data.school?.name
                ? `Generated by Akademee · ${data.school.name}`
                : 'Generated by Akademee',
              46,
              820,
              { width: 503, align: 'center' }
            );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Draw the whole document. Pure layout code.
   */
  render(doc, data, lang) {
    const t = (fr, en) => (lang === 'fr' ? fr : en);
    const pc = data.school?.primaryColor || FALLBACK_COLOR;
    const lighter = mixWithWhite(pc, 96);

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 46;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const BOTTOM_LIMIT = PAGE_H - 78; // footer zone

    const ensureSpace = (needed) => {
      if (doc.y + needed > BOTTOM_LIMIT) {
        doc.addPage();
        doc.y = MARGIN;
      }
    };

    // ── Header band ──
    doc.rect(0, 0, PAGE_W, 104).fill(pc);
    // Monogram (centered inside the white circle: circle center = (70,52) r=22)
    const mono = initials(data.school?.name);
    doc.save().circle(70, 52, 22).fill('#ffffff');
    doc
      .fillColor(pc)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(mono, 50, 40, { width: 40, align: 'center' });
    doc.restore();
    // School name + tagline
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(19);
    doc.text(data.school?.name || 'School', 104, 26, { width: 330 });
    doc.font('Helvetica').fontSize(9.5).fillColor(mixWithWhite(pc, 78));
    doc.text(data.school?.tagline || '', 104, 50, { width: 330 });
    doc.fillColor(mixWithWhite(pc, 70)).fontSize(9);
    const location = [data.school?.city, data.school?.region].filter(Boolean).join(', ');
    doc.text([location, data.school?.subdomain].filter(Boolean).join(' · '), 104, 70, { width: 330 });
    // Right side: document title + date
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13);
    doc.text(t('SITUATION FINANCIÈRE', 'FINANCIAL STATEMENT'), 370, 30, {
      width: PAGE_W - MARGIN - 370,
      align: 'right',
    });
    doc.font('Helvetica').fontSize(8.5).fillColor(mixWithWhite(pc, 78));
    const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`${t('Édité le', 'Issued on')} ${today}`, 370, 52, {
      width: PAGE_W - MARGIN - 370,
      align: 'right',
    });
    doc.text(
      `${t('Année académique', 'Academic year')}: ${data.year?.name || t('—', '—')}`,
      370,
      66,
      { width: PAGE_W - MARGIN - 370, align: 'right' }
    );
    doc.y = 124;

    // ── Key figures ──
    const sectionTitle = (title) => {
      ensureSpace(46);
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#111827')
        .text(title, MARGIN, doc.y);
      doc.moveDown(0.4);
      doc.rect(MARGIN, doc.y - 4, 28, 3).fill(pc);
      doc.moveDown(1.2);
    };

    sectionTitle(t('Chiffres clés', 'Key figures'));

    const statBoxes = [
      {
        label: t('Total encaissé', 'Total collected'),
        value: fmtMoney(data.totalCollected),
        color: '#1D9E75',
      },
      {
        label: t('Impayés', 'Outstanding'),
        value: fmtMoney(data.outstanding),
        color: '#EF4444',
      },
      {
        label: t('Taux de recouvrement', 'Collection rate'),
        value: `${data.collectionRate}%`,
        color: '#3B82F6',
      },
      {
        label: t('Paiements', 'Payments'),
        value: String(data.paymentCount).padStart(2, '0'),
        color: '#8B5CF6',
      },
    ];

    const gap = 10;
    const boxW = (CONTENT_W - gap * 3) / 4;
    const figuresY = doc.y;
    statBoxes.forEach((box, i) => {
      const x = MARGIN + i * (boxW + gap);
      doc.roundedRect(x, figuresY, boxW, 66, 8).fill(lighter);
      doc.rect(x, figuresY, boxW, 4).fill(box.color);
      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(box.value, x + 10, figuresY + 14, { width: boxW - 20 });
      doc
        .fillColor('#6B7280')
        .font('Helvetica')
        .fontSize(8.5)
        .text(box.label, x + 10, figuresY + 38, { width: boxW - 20 });
    });
    doc.y = figuresY + 80;

    // ── Generic table (columns: [{ label, x, w, align }]) ──
    const drawTable = ({ columns, rows, startY }) => {
      const rowH = 18;
      const drawHeader = (yy) => {
        doc.rect(MARGIN, yy, CONTENT_W, rowH).fill(pc);
        columns.forEach((col) => {
          doc
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .text(col.label, MARGIN + col.x, yy + 5, { width: col.w, align: col.align });
        });
        return yy + rowH;
      };
      let yy = drawHeader(startY);
      rows.forEach((row, r) => {
        if (yy + rowH > BOTTOM_LIMIT) {
          doc.addPage();
          yy = MARGIN;
          yy = drawHeader(yy);
        }
        doc.rect(MARGIN, yy, CONTENT_W, rowH).fill(r % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
        row.forEach((cell, i) => {
          doc
            .fillColor('#374151')
            .font('Helvetica')
            .fontSize(9)
            .text(String(cell), MARGIN + columns[i].x, yy + 5, {
              width: columns[i].w,
              align: columns[i].align,
            });
        });
        yy += rowH;
      });
      return yy + 8;
    };

    const moneyW = 150;
    const monthW = CONTENT_W - moneyW;

    if (data.monthlyCollections.length > 0) {
      sectionTitle(t('Encaissements mensuels (7 derniers mois)', 'Monthly collections (last 7 months)'));
      doc.y = drawTable({
        columns: [
          { label: t('Mois', 'Month'), x: 0, w: monthW, align: 'left' },
          { label: t('Montant', 'Amount'), x: monthW, w: moneyW, align: 'right' },
        ],
        rows: data.monthlyCollections.map((m) => [
          m.month,
          fmtMoney(m.total),
        ]),
        startY: doc.y,
      });
      // Monthly total line
      const totalY = doc.y;
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#111827')
        .text(t('Total (période)', 'Total (period)'), MARGIN, totalY, { width: monthW });
      doc
        .fillColor(pc)
        .text(fmtMoney(data.totalCollected), MARGIN + monthW, totalY, {
          width: moneyW,
          align: 'right',
        });
      doc.moveDown(1.6);
    }

    // ── Collection by class table ──
    if (data.collectionByClass.length > 0) {
      sectionTitle(t('Recouvrement par classe', 'Collection by class'));
      const nameCW = CONTENT_W * 0.32;
      const dueCW = CONTENT_W * 0.24;
      const paidCW = CONTENT_W * 0.24;
      const rateCW = CONTENT_W * 0.2;
      doc.y = drawTable({
        columns: [
          { label: t('Classe', 'Class'), x: 0, w: nameCW, align: 'left' },
          { label: t('Frais dus', 'Fees due'), x: nameCW, w: dueCW, align: 'right' },
          { label: t('Payé', 'Paid'), x: nameCW + dueCW, w: paidCW, align: 'right' },
          { label: t('Taux', 'Rate'), x: nameCW + dueCW + paidCW, w: rateCW, align: 'right' },
        ],
        rows: data.collectionByClass.map((c) => {
          const rate = c.totalFees > 0 ? Math.round((c.totalPaid / c.totalFees) * 100) : 0;
          return [
            c.name,
            fmtMoney(c.totalFees),
            fmtMoney(c.totalPaid),
            `${rate}%`,
          ];
        }),
        startY: doc.y,
      });
      doc.moveDown(0.6);
    }

    // ── Fee status overview ──
    sectionTitle(t('Statut des frais (élèves actifs)', 'Fee status (active students)'));
    const statusItems = [
      { label: t('Soldés', 'Fully paid'), value: data.feeStatusOverview.paid, color: '#1D9E75' },
      { label: t('Partiels', 'Partial'), value: data.feeStatusOverview.partial, color: '#F59E0B' },
      { label: t('Impayés', 'Unpaid'), value: data.feeStatusOverview.unpaid, color: '#EF4444' },
    ];
    const statusBoxW = (CONTENT_W - gap * 2) / 3;
    const statusY = doc.y;
    statusItems.forEach((item, i) => {
      const x = MARGIN + i * (statusBoxW + gap);
      doc.roundedRect(x, statusY, statusBoxW, 46, 8).fill(lighter);
      doc.rect(x, statusY, 4, 46).fill(item.color);
      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(String(item.value), x + 14, statusY + 7, { width: statusBoxW - 24 });
      doc
        .fillColor('#6B7280')
        .font('Helvetica')
        .fontSize(8.5)
        .text(item.label, x + 14, statusY + 27, { width: statusBoxW - 24 });
    });
    doc.y = statusY + 60;

    // ── Top outstanding balances ──
    if (data.topBalances.length > 0) {
      sectionTitle(t('Principaux impayés', 'Top outstanding balances'));
      const nameW = CONTENT_W * 0.5;
      const classW = CONTENT_W * 0.26;
      const balW = CONTENT_W - nameW - classW;
      doc.y = drawTable({
        columns: [
          { label: t('Élève', 'Student'), x: 0, w: nameW, align: 'left' },
          { label: t('Classe', 'Class'), x: nameW, w: classW, align: 'left' },
          { label: t('Solde', 'Balance'), x: nameW + classW, w: balW, align: 'right' },
        ],
        rows: data.topBalances.map((b) => [b.name, b.className, fmtMoney(b.balance)]),
        startY: doc.y,
      });
      doc.moveDown(0.8);
    }

    // ── Signature block ──
    ensureSpace(120);
    doc.moveDown(2);
    const half = CONTENT_W / 2 - 10;
    doc.strokeColor('#D1D5DB').lineWidth(1);
    doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + half, doc.y).stroke();
    doc.moveTo(MARGIN + half + 20, doc.y).lineTo(PAGE_W - MARGIN, doc.y).stroke();
    doc.y += 8;
    doc
      .fillColor('#111827')
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(t('Préparé par (Comptabilité)', 'Prepared by (Accounting)'), MARGIN, doc.y, {
        width: half,
      });
    doc
      .text(t('Approuvé par (Administration)', 'Approved by (Administration)'), MARGIN + half + 20, doc.y, {
        width: half,
      });
    doc.moveDown(1.4);
    doc
      .fillColor('#6B7280')
      .font('Helvetica')
      .fontSize(8.5)
      .text(`${t('Date', 'Date')}: ${today}`, MARGIN, doc.y, { width: half });
    doc.text(
      `${data.school?.subdomain ? `${t('Campus', 'Campus')}: ${data.school.subdomain}` : ''}`,
      MARGIN + half + 20,
      doc.y,
      { width: half }
    );
  }
}

module.exports = new FinancialStatementService();
