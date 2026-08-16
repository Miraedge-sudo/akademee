/**
 * Report Card PDF Service
 *
 * Server-side, deterministic report card PDF rendering via Puppeteer.
 *
 * Why this exists:
 *  - The previous flow rendered the bulletin in the browser (React
 *    BulletinTemplate) and "screenshotted" it with html2canvas + jsPDF.
 *    That is device-dependent, non-deterministic, produces rasterized
 *    (non-searchable) output and breaks pagination on long bulletins.
 *  - This service renders the SAME design as a pure HTML string on the
 *    server, then prints it with headless Chrome. Output is deterministic,
 *    text is selectable/searchable, and pagination is handled by real CSS
 *    print rules (@media print + page-break-inside) across any OS.
 *
 * The HTML template is a faithful port of frontend/src/app/components/ui/
 * BulletinTemplate.jsx — the backend is the single source of truth for the
 * bulletin layout, driven entirely by the report card payload.
 *
 * Browser lifecycle:
 *  - A single Chromium instance is launched lazily and reused across
 *    requests (page.pdf is called per render). Close it via closeBrowser()
 *    on shutdown (see server.js).
 *  - Executable resolution: PUPPETEER_EXECUTABLE_PATH env var first, then
 *    common Chrome/Chromium/Edge locations per platform.
 */

const puppeteer = require('puppeteer-core');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// ------------------------------------------------------------------
// Print CSS (mirrors BulletinTemplate.jsx design + real pagination)
// ------------------------------------------------------------------
const PRINT_CSS = `
  @page { size: A4 portrait; margin: 15mm 12mm; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1c1c1a;
    background: #FBFAF6;
    font-size: 11.5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { box-sizing: border-box; }
  .bulletin { position: relative; }
  .watermark {
    position: absolute; top: 52%; left: 50%;
    transform: translate(-50%, -50%) rotate(-28deg);
    font-size: 64px; font-weight: 700;
    color: rgba(20,20,20,.045);
    white-space: nowrap; pointer-events: none;
    letter-spacing: .05em; z-index: 0;
  }
  .content { position: relative; padding: 0 2px; z-index: 1; }

  .letterhead { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1c1c1a; padding-bottom: 14px; margin-bottom: 16px; }
  .lh-logo { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #1c1c1a; flex-shrink: 0; }
  .lh-fallback { width: 56px; height: 56px; border-radius: 50%; border: 2px solid #1c1c1a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 15px; font-weight: 800; letter-spacing: .04em; text-align: center; line-height: 1.15; }
  .lh-center { flex: 1; text-align: center; }
  .lh-republic { font-size: 12.5px; font-weight: 700; letter-spacing: .02em; }
  .lh-motto { font-size: 10.5px; font-style: italic; color: #4a4a45; margin-top: 1px; }
  .lh-ministry { font-size: 11.5px; margin-top: 6px; font-weight: 600; }
  .lh-badge { flex-shrink: 0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: 5px 9px; border-radius: 3px; color: #fff; white-space: nowrap; }

  .doc-title { text-align: center; font-size: 16px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; margin: 14px 0 4px; }
  .doc-subtitle { text-align: center; font-size: 11.5px; color: #4a4a45; margin-bottom: 16px; }

  .identity { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 26px; font-size: 12px; border: 1px solid #c9c6ba; padding: 12px 16px; margin-bottom: 18px; background: rgba(0,0,0,.015); page-break-inside: avoid; break-inside: avoid; }
  .id-row { display: flex; justify-content: space-between; border-bottom: 1px dotted #c9c6ba; padding: 3px 0; }
  .id-label { font-weight: 400; color: #4a4a45; }
  .id-value { font-weight: 600; text-align: right; }

  table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 14px; }
  caption { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 6px 0; border-bottom: 1px solid #1c1c1a; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  th {
    border: 1px solid #c9c6ba; background: rgba(0,0,0,.05);
    font-weight: 700; font-size: 10.5px; text-transform: uppercase;
    letter-spacing: .02em; padding: 6px 7px; text-align: center;
  }
  td { border: 1px solid #c9c6ba; padding: 6px 7px; text-align: center; font-size: 11.5px; }
  td.left, th.left { text-align: left; }
  .na { color: #4a4a45; font-style: italic; }

  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; page-break-inside: avoid; break-inside: avoid; }
  .sum-box { border: 1px solid #1c1c1a; padding: 9px 10px; text-align: center; }
  .sum-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; color: #4a4a45; }
  .general-remark { border: 1px solid #1c1c1a; padding: 10px 12px; margin: 16px 0; page-break-inside: avoid; break-inside: avoid; }
  .general-remark .sum-label { margin-bottom: 4px; }
  .general-remark-text { font-size: 12px; line-height: 1.55; }
  .sum-value { font-size: 17px; font-weight: 700; margin-top: 3px; }
  .sum-value-sm { font-size: 13px; font-weight: 700; margin-top: 3px; }

  .attendance { display: flex; justify-content: space-between; gap: 20px; font-size: 11.5px; margin: 14px 0; padding: 10px 0; border-top: 1px solid #c9c6ba; border-bottom: 1px solid #c9c6ba; page-break-inside: avoid; break-inside: avoid; }
  .att-label { display: block; font-size: 9.5px; text-transform: uppercase; color: #4a4a45; font-weight: 400; letter-spacing: .04em; margin-bottom: 2px; }

  .decision { text-align: center; font-size: 12.5px; font-weight: 700; padding: 9px; margin: 14px 0; border: 1.5px solid #1c1c1a; page-break-inside: avoid; break-inside: avoid; }

  .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 34px; font-size: 11px; text-align: center; color: #4a4a45; }
  .sig { border-top: 1px solid #1c1c1a; margin-top: 38px; padding-top: 5px; }

  .footer { display: flex; justify-content: space-between; font-size: 9.5px; color: #4a4a45; margin-top: 22px; border-top: 1px solid #c9c6ba; padding-top: 8px; }

  /* Combined exports: each bulletin starts on a fresh page */
  .bulletin + .bulletin { page-break-before: always; break-before: page; }
`;

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** HTML-escape user-provided strings (XSS-safe when injected into template). */
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a score with N decimals (or '' when null). */
function fmt(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
  return Number(value).toFixed(decimals);
}

function scoreColor(score) {
  const pct = (score / 20) * 100;
  if (pct >= 60) return '#1D9E75';
  if (pct >= 40) return '#F59E0B';
  return '#EF4444';
}

function mapPeriodType(backendType) {
  const t = (backendType || '').toLowerCase();
  if (t === 'sequence' || t === 'sequentiel') return 'SEQUENTIEL';
  if (t === 'term' || t === 'trimestre' || t === 'quarter' || t === 'semester') return 'TRIMESTRIEL';
  if (t === 'annual' || t === 'academic_year' || t === 'annuel') return 'ANNUEL';
  return 'SEQUENTIEL';
}

/** Pick best label given language mode ('fr' | 'en' | 'BILINGUAL'). */
function pickLabel(lang, fr, en) {
  const l = String(lang || '').toLowerCase();
  if (l === 'fr') return fr || en || '';
  if (l === 'en') return en || fr || '';
  // Bilingual — prefer English, fall back to French
  return en || fr || '';
}

function schoolInitials(name) {
  if (!name) return 'SCH';
  return name
    .split(/[\s]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ------------------------------------------------------------------
// Section builders
// ------------------------------------------------------------------

function buildLetterhead(eduConfig, schoolInfo) {
  const fr = eduConfig.lang === 'fr';
  const accent = eduConfig.accent || '#1B6B3C';
  const hasLogo = schoolInfo.logoUrl;
  const initials = schoolInitials(schoolInfo.name);

  return `
    <div class="letterhead">
      ${hasLogo
        // NOTE: no crossorigin attribute — page.pdf() does not taint anything,
        // and crossorigin would break logos whose host lacks CORS headers.
        ? `<img class="lh-logo" src="${esc(schoolInfo.logoUrl)}" alt=""
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
           <div class="lh-fallback" style="display:none;">${esc(initials)}</div>`
        : `<div class="lh-fallback" style="display:flex;">${esc(initials)}</div>`}
      <div class="lh-center">
        <div class="lh-republic">${fr ? 'RÉPUBLIQUE DU CAMEROUN' : 'REPUBLIC OF CAMEROON'}</div>
        <div class="lh-motto">${fr ? 'Paix – Travail – Patrie' : 'Peace – Work – Fatherland'}</div>
        <div class="lh-ministry">${esc(fr ? eduConfig.ministry_fr : eduConfig.ministry_en)}</div>
      </div>
      <div class="lh-badge" style="background:${esc(accent)};">${esc(pickLabel(eduConfig.lang, eduConfig.name_fr, eduConfig.name_en))}</div>
    </div>`;
}

function buildDocTitle(eduConfig, periodType, payload, opts) {
  const fr = eduConfig.lang === 'fr';
  const plabels = eduConfig.period_labels?.[periodType] || {};
  const isUniv = eduConfig.is_university === true;
  const count = plabels.count || 1;
  const periodNoun = isUniv
    ? (periodType === 'ANNUEL' ? (fr ? 'Année' : 'Year') : (fr ? 'N°' : 'No.'))
    : (fr ? `${plabels.unit_fr || ''} n°` : `${plabels.unit_en || ''} No.`);

  const schoolInfo = payload.school_info || {};
  const student = payload.student || {};
  const name = schoolInfo.name || opts.schoolName || 'Établissement';
  const city = schoolInfo.city ? ` — ${schoolInfo.city}` : '';
  const className = student.class_name || '';
  const year = `${opts.academicYear - 1}/${opts.academicYear}`;
  const periodIndex = 0;
  const seqLabel = payload.period?.sequence_label || null;

  const subtitleParts = [`${esc(name)}${city}`];
  if (className) subtitleParts.push(esc(className));
  subtitleParts.push(`${fr ? 'Année Scolaire' : 'Academic Year'} ${year}`);
  if (count > 1) subtitleParts.push(`${esc(periodNoun)} ${periodIndex + 1}/${count}`);
  if (seqLabel) subtitleParts.push(esc(seqLabel));

  return `
    <div class="doc-title">${esc(pickLabel(eduConfig.lang, plabels.doc_fr, plabels.doc_en))}</div>
    <div class="doc-subtitle">${subtitleParts.join(' — ')}</div>`;
}

function buildIdentity(payload, eduConfig) {
  const fr = eduConfig.lang === 'fr';
  const isUniv = eduConfig.is_university === true;
  const student = payload.student || {};
  const className = student.class_name || '—';
  const dob = student.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString(fr ? 'fr-FR' : 'en-GB')
    : '—';

  const rows = [
    [fr ? (isUniv ? "Nom & Prénom" : "Nom de l'élève") : "Student's name", student.full_name || '—'],
    [fr ? 'Matricule' : 'Registration No.', student.registration_number || (student.id ? String(student.id).slice(0, 8) : '—')],
    [fr ? (isUniv ? 'Filière' : 'Classe') : 'Class', className],
    [fr ? 'Sexe' : 'Sex', student.gender || '—'],
    [fr ? 'Né(e) le' : 'Date of birth', dob],
    [fr ? 'Redoublant(e)' : 'Repeater', fr ? 'Non' : 'No'],
  ];

  return `
    <div class="identity">
      ${rows.map(([label, value]) => `
        <div class="id-row"><span class="id-label">${esc(label)}</span><span class="id-value">${esc(value)}</span></div>
      `).join('')}
    </div>`;
}

// ── Subject table ──
function buildSubjectTable(payload, eduConfig, periodType) {
  const fr = eduConfig.lang === 'fr';
  const isUniv = eduConfig.is_university === true;
  const subjects = payload.subjects || [];

  const hasSplitScores = subjects.some((s) => s.theoryScore != null || s.practicalScore != null);
  const hasComponentScores = subjects.some((s) => s.caScore != null || s.examScore != null);
  const isSplitMode = hasSplitScores && !isUniv &&
    (eduConfig.code === 'ANG_TECH' || eduConfig.code === 'FR_TECH');

  const seqCount = subjects.length > 0 ? (subjects[0].sequenceScores?.length || 0) : 0;

  const th = (label, extra = '') => `<th class="${extra}">${esc(label)}</th>`;

  let headerCells = '';
  if (isUniv) {
    headerCells = [
      th(fr ? "Unité d'Enseignement" : 'Course Unit', 'left'),
      th(fr ? 'Crédits' : 'Credits'),
      hasComponentScores ? th(fr ? 'CC (40%)' : 'CA (40%)') : '',
      hasComponentScores ? th(fr ? 'Examen (60%)' : 'Exam (60%)') : '',
      th(fr ? 'Note /20' : 'Grade /20'),
      th(fr ? 'Résultat' : 'Result'),
    ].join('');
  } else if (periodType === 'SEQUENTIEL') {
    headerCells = [
      th(fr ? 'Matière' : 'Subject', 'left'),
      isSplitMode ? th(fr ? 'Théorie' : 'Theory') : th(fr ? 'C.C. (30%)' : 'CA (30%)'),
      isSplitMode ? th(fr ? 'Pratique' : 'Practical') : th(fr ? 'Examen (70%)' : 'Exam (70%)'),
      th(fr ? 'Moy./20' : 'Avg./20'),
      th(fr ? 'Coef.' : 'Coef.'),
      th(fr ? 'Moy.×Coef.' : 'Total Pts'),
      th(fr ? 'Rang' : 'Rank'),
      th(fr ? 'Appréciation' : 'Remark', 'left'),
    ].join('');
  } else if (periodType === 'TRIMESTRIEL') {
    const seqHeaders = [];
    if (seqCount > 0) {
      for (let i = 0; i < seqCount; i++) {
        const seq = subjects[0].sequenceScores[i];
        seqHeaders.push(th(seq?.sequenceLabel ? seq.sequenceLabel : `${fr ? 'Séq.' : 'Seq.'}${i + 1}`));
      }
    } else {
      seqHeaders.push(th(fr ? 'Séq.' : 'Seq.'));
    }
    headerCells = [
      th(fr ? 'Matière' : 'Subject', 'left'),
      ...seqHeaders,
      th(fr ? 'Moy. Trim./20' : 'Term Avg./20'),
      th(fr ? 'Coef.' : 'Coef.'),
      th(fr ? 'Total Pts' : 'Total Pts'),
      th(fr ? 'Rang' : 'Rank'),
    ].join('');
  } else {
    // ANNUEL
    headerCells = [
      th(fr ? 'Matière' : 'Subject', 'left'),
      th(fr ? 'Trim.1' : 'Term 1'),
      th(fr ? 'Trim.2' : 'Term 2'),
      th(fr ? 'Trim.3' : 'Term 3'),
      th(fr ? 'Moy. Ann./20' : 'Annual Avg./20'),
      th(fr ? 'Coef.' : 'Coef.'),
      th(fr ? 'Total Pts' : 'Total Pts'),
      th(fr ? 'Rang' : 'Rank'),
    ].join('');
  }

  // ── Rows ──
  const na = (inner) => `<span class="na">${inner}</span>`;

  const rows = subjects.map((subj, i) => {
    const displayName = esc(subj.name || subj.subjectCode || subj.nameFr || subj.nameEn || `Subject #${i + 1}`);
    const isNA = subj.score == null;
    const avgCell = isNA
      ? na('—')
      : `<b style="color:${scoreColor(subj.score)};">${fmt(subj.score, 1)}</b>`;

    const remark = subj.teacherRemark
      ? esc(subj.teacherRemark)
      : (isNA ? na('—') : na(fr ? 'En attente d\'appréciation' : 'Awaiting remark'));

    const cell = (inner, cls = '') => `<td class="${cls}">${inner}</td>`;

    if (isUniv) {
      const passMark = Number(payload.summary?.pass_mark) || 10;
      const validated = !isNA && subj.score >= passMark;
      return `<tr>
        ${cell(displayName, 'left')}
        ${cell(esc(subj.coefficient || subj.credits || '—'))}
        ${hasComponentScores ? cell(subj.caScore != null ? fmt(subj.caScore, 1) : na('—')) : ''}
        ${hasComponentScores ? cell(subj.examScore != null ? fmt(subj.examScore, 1) : na('—')) : ''}
        ${cell(`<b>${avgCell}</b>`)}
        ${cell(isNA ? na('—') : validated
          ? `<span style="color:#1B6B3C;font-weight:600;">${fr ? 'Validé' : 'Passed'}</span>`
          : `<span style="color:#9B2C2C;font-weight:600;">${fr ? 'Non validé' : 'Failed'}</span>`)}
      </tr>`;
    }

    if (periodType === 'SEQUENTIEL') {
      const showCa = subj.caScore != null;
      const showExam = subj.examScore != null;
      const showTheory = subj.theoryScore != null;
      const showPractical = subj.practicalScore != null;

      return `<tr>
        ${cell(displayName, 'left')}
        ${isSplitMode
          ? `${cell(showTheory ? fmt(subj.theoryScore, 1) : na('—'))}${cell(showPractical ? fmt(subj.practicalScore, 1) : na('—'))}`
          : `${cell(showCa ? fmt(subj.caScore, 1) : na('—'))}${cell(showExam ? fmt(subj.examScore, 1) : na('—'))}`}
        ${cell(avgCell)}
        ${cell(esc(subj.coefficient))}
        ${cell(isNA ? na('—') : fmt(subj.weightedPoints, 1))}
        ${cell(esc(subj.subjectRank || '—'))}
        ${cell(remark, 'left')}
      </tr>`;
    }

    if (periodType === 'TRIMESTRIEL') {
      const seqScores = subj.sequenceScores || [];
      const seqCells = seqScores.length > 0
        ? seqScores.map((sq) => cell(sq.score != null
            ? `<span style="color:${scoreColor(sq.score)};">${fmt(sq.score, 1)}</span>`
            : na('—'))).join('')
        : cell(na('—'));
      return `<tr>
        ${cell(displayName, 'left')}
        ${seqCells}
        ${cell(avgCell)}
        ${cell(esc(subj.coefficient))}
        ${cell(isNA ? na('—') : fmt(subj.weightedPoints, 1))}
        ${cell(esc(subj.subjectRank || '—'))}
      </tr>`;
    }

    // ANNUEL
    return `<tr>
      ${cell(displayName, 'left')}
      ${cell(na('—'))}
      ${cell(na('—'))}
      ${cell(na('—'))}
      ${cell(avgCell)}
      ${cell(esc(subj.coefficient))}
      ${cell(isNA ? na('—') : fmt(subj.weightedPoints, 1))}
      ${cell(esc(subj.subjectRank || '—'))}
    </tr>`;
  });

  const caption = fr
    ? `Résultats par ${isUniv ? "unité d'enseignement" : 'matière'}`
    : `Results by ${isUniv ? 'course unit' : 'subject'}`;

  return `
    <table>
      <caption>${esc(caption)}</caption>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${rows.length ? rows.join('') : `<tr><td colspan="8" class="na" style="padding:20px;text-align:center;">
        ${fr ? 'Aucune note disponible pour cette période' : 'No grades available for this period'}
      </td></tr>`}</tbody>
    </table>`;
}

function buildSummary(payload) {
  const summary = payload.summary || {};
  const fr = payload.education_system_config?.lang === 'fr';

  const box = (label, value, small = false) => `
    <div class="sum-box">
      <div class="sum-label">${esc(label)}</div>
      <div class="${small ? 'sum-value-sm' : 'sum-value'}">${esc(value)}</div>
    </div>`;

  return `<div class="summary">
    ${box(fr ? 'Moyenne générale' : 'Overall average', summary.general_average != null ? `${Number(summary.general_average).toFixed(2)}/20` : '—')}
    ${box(fr ? 'Rang' : 'Rank', summary.class_rank || '—')}
    ${box(fr ? 'Moyenne de la classe' : 'Class average', summary.class_average != null ? `${Number(summary.class_average).toFixed(2)}/20` : '—')}
    ${box(fr ? 'Mention' : 'Remark', summary.mention || '—', true)}
  </div>`;
}

function buildGeneralRemark(payload) {
  const fr = payload.education_system_config?.lang === 'fr';
  const remark = payload.summary?.general_remark;
  return `<div class="general-remark">
    <div class="sum-label">${fr ? 'Appréciation générale' : 'General remark'}</div>
    <div class="general-remark-text">${remark ? esc(remark) : '—'}</div>
  </div>`;
}

function buildAttendance(payload) {
  const attendance = payload.attendance;
  if (!attendance || (!attendance.total && !attendance.excused && !attendance.absent)) return '';

  const fr = payload.education_system_config?.lang === 'fr';

  const item = (label, value) => `
    <div><b class="att-label">${esc(label)}</b>${esc(value)}</div>`;

  return `<div class="attendance">
    ${item(fr ? 'Conduite' : 'Conduct', fr ? 'Bonne' : 'Good')}
    ${item(fr ? 'Absences justifiées' : 'Justified absences', `${attendance.excused || 0}h`)}
    ${item(fr ? 'Absences injustifiées' : 'Unjustified absences', `${attendance.absent || 0}h`)}
    ${item(fr ? 'Retards' : 'Late arrivals', String(attendance.late || 0))}
    ${item(fr ? 'Taux de présence' : 'Attendance rate', attendance.attendanceRate != null ? `${attendance.attendanceRate}%` : '—')}
  </div>`;
}

function buildDecision(periodType, eduConfig) {
  if (periodType !== 'ANNUEL') return '';
  const fr = eduConfig.lang === 'fr';
  const isUniv = eduConfig.is_university === true;
  const text = isUniv
    ? (fr ? 'DÉCISION : ANNÉE VALIDÉE — PASSAGE EN NIVEAU SUPÉRIEUR' : 'DECISION: YEAR VALIDATED — PROMOTED TO NEXT LEVEL')
    : (fr ? 'DÉCISION DU CONSEIL DE CLASSE : ADMIS(E) EN CLASSE SUPÉRIEURE' : 'CLASS COUNCIL DECISION: PROMOTED TO THE NEXT CLASS');
  return `<div class="decision">${esc(text)}</div>`;
}

function buildSignatures(eduConfig) {
  const fr = eduConfig.lang === 'fr';
  const isUniv = eduConfig.is_university === true;
  const labels = [
    fr ? 'Professeur Principal' : 'Class Master',
    fr ? 'Parent / Tuteur' : 'Parent / Guardian',
    fr ? (isUniv ? 'Le Doyen' : "Le Chef d'Établissement") : (isUniv ? 'Dean' : 'Principal'),
  ];
  return `<div class="signatures">
    ${labels.map((l) => `<div class="sig">${esc(l)}</div>`).join('')}
  </div>`;
}

function buildFooter(payload, opts) {
  const fr = payload.education_system_config?.lang === 'fr';
  const schoolInfo = payload.school_info || {};
  const now = opts.now.toLocaleDateString(fr ? 'fr-FR' : 'en-GB');

  const parts = [`${fr ? 'Édité le' : 'Issued on'} ${now}`];
  if (schoolInfo.phone) parts.push(` — ${esc(schoolInfo.phone)}`);
  if (schoolInfo.email) parts.push(` — ${esc(schoolInfo.email)}`);

  return `<div class="footer">
    <span>${parts.join('')}</span>
    <span>${fr
      ? 'Document généré automatiquement — cachet et signature requis pour validité'
      : 'System-generated document — stamp and signature required for validity'}</span>
  </div>`;
}

// ------------------------------------------------------------------
// Public: HTML template
// ------------------------------------------------------------------

/**
 * Build the full standalone HTML document for a report card payload.
 *
 * @param {object} payload — the /report-cards/:id/payload response
 * @param {object} [options]
 *   - schoolName  : fallback school name
 *   - now         : Date used for footer (defaults to new Date())
 *   - academicYear: 4-digit year for the "Academic Year Y-1/Y" label
 * @returns {Promise<string>} HTML string (async only to allow future logo inlining)
 */
function buildBulletinBlock(payload, options = {}) {
  const now = options.now || new Date();
  const academicYear = options.academicYear || now.getFullYear();

  const eduConfig = payload.education_system_config || {};
  const periodType = payload.period?.sequence_label
    ? 'SEQUENTIEL'
    : mapPeriodType(payload.period?.type);

  const watermark = esc((payload.school_info?.name || options.schoolName || 'AKADEMEE')
    .split(',')[0].split('—')[0].trim());

  return `<div class="bulletin">
    <div class="watermark">${watermark}</div>
    <div class="content">
      ${buildLetterhead(eduConfig, payload.school_info || {})}
      ${buildDocTitle(eduConfig, periodType, payload, { schoolName: options.schoolName, academicYear })}
      ${buildIdentity(payload, eduConfig)}
      ${buildSubjectTable(payload, eduConfig, periodType)}
      ${buildSummary(payload)}
      ${buildGeneralRemark(payload)}
      ${buildAttendance(payload)}
      ${buildDecision(periodType, eduConfig)}
      ${buildSignatures(eduConfig)}
      ${buildFooter(payload, { now })}
    </div>
  </div>`;
}

async function renderReportCardHtml(payload, options = {}) {
  const eduConfig = payload.education_system_config || {};
  const html = `<!DOCTYPE html>
<html lang="${eduConfig.lang === 'fr' ? 'fr' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <title>Report Card</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${buildBulletinBlock(payload, options)}
</body>
</html>`;

  return html;
}

/**
 * Render MANY report cards into a single HTML document.
 * Each bulletin is a full block; the CSS `.bulletin + .bulletin` rule
 * forces a page break between consecutive bulletins, so one PDF contains
 * one bulletin per page (deterministic pagination).
 *
 * @param {Array<object>} payloads — report card payloads in desired order
 * @param {object} [options] — shared render options
 * @returns {Promise<string>} combined HTML document
 */
async function renderReportCardsHtml(payloads = [], options = {}) {
  const eduConfig = payloads[0]?.education_system_config || {};
  const blocks = payloads.map((p) => buildBulletinBlock(p, options)).join('\n');
  return `<!DOCTYPE html>
<html lang="${eduConfig.lang === 'fr' ? 'fr' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <title>Report Cards</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${blocks}
</body>
</html>`;
}

// ------------------------------------------------------------------
// Public: Puppeteer rendering
// ------------------------------------------------------------------

let browserPromise = null;

// ── Render concurrency limiter ──
// Rendering uses a shared browser; cap concurrent page.pdf() calls so a burst
// of downloads cannot spawn unbounded pages and exhaust memory.
const MAX_CONCURRENT_RENDERS = 3;
let activeRenders = 0;
const renderWaiters = [];

async function acquireRenderSlot() {
  if (activeRenders < MAX_CONCURRENT_RENDERS) {
    activeRenders++;
    return;
  }
  await new Promise((resolve) => renderWaiters.push(resolve));
  activeRenders++;
}

function releaseRenderSlot() {
  activeRenders--;
  const next = renderWaiters.shift();
  if (next) next();
}

/** Resolve the Chrome/Chromium/Edge executable path. */
function resolveExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidates = [];
  if (process.platform === 'win32') {
    candidates.push(
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    );
  } else {
    candidates.push(
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
    );
  }

  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Get (and lazily launch) the shared browser instance. */
async function getBrowser() {
  if (browserPromise) return browserPromise;

  const executablePath = resolveExecutablePath();
  if (!executablePath) {
    throw new Error(
      'No Chrome/Chromium executable found. Set PUPPETEER_EXECUTABLE_PATH ' +
      'or install Chromium (see Dockerfile).'
    );
  }

  logger.info(`[ReportCardPdf] Launching browser at ${executablePath}`);

  browserPromise = puppeteer
    .launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--disable-gpu',
      ],
    })
    .catch((err) => {
      logger.error('[ReportCardPdf] Browser launch failed:', err.message);
      browserPromise = null; // allow retry on next request
      throw err;
    });

  return browserPromise;
}

/**
 * Print a fully-rendered HTML document to a PDF buffer using the shared browser.
 * Honors the concurrency limiter; the render slot is always released via finally.
 *
 * @param {string} html — complete HTML document
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePdfFromHtml(html) {
  const browser = await getBrowser();

  await acquireRenderSlot();
  try {
    // newPage() is INSIDE the try: if it (or anything below) throws, the
    // finally still releases the render slot — no permanent deadlock.
    const page = await browser.newPage();
    try {
      await page.setContent(html, {
        // networkidle2 instead of networkidle0: we must NOT wait forever on a
        // slow logo URL — the inline onerror fallback handles missing logos.
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      // Margins come from the CSS @page rule (PRINT_CSS), which is the single
      // source of truth when preferCSSPageSize is true.
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });

      return Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    } finally {
      await page.close().catch(() => {});
    }
  } finally {
    releaseRenderSlot();
  }
}

/**
 * Render a report card payload to a PDF buffer.
 *
 * @param {object} payload — the /report-cards/:id/payload response
 * @param {object} [options] — passed to renderReportCardHtml + pdf overrides
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateReportCardPdf(payload, options = {}) {
  const html = await renderReportCardHtml(payload, options);
  return generatePdfFromHtml(html);
}

/**
 * Render MANY report cards into a single combined PDF (one bulletin per page).
 *
 * @param {Array<object>} payloads — report card payloads in desired order
 * @param {object} [options] — shared render options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateReportCardsPdf(payloads = [], options = {}) {
  const html = await renderReportCardsHtml(payloads, options);
  return generatePdfFromHtml(html);
}

/** Strip characters that are unsafe in filenames / ZIP entry paths. */
function sanitizeFileName(name) {
  const cleaned = String(name || '')
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'sans-nom';
}

/** Run fn over items with a bounded concurrency (order-preserving). */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Build a ZIP buffer from [{ path, buffer }] entries. */
async function buildZipBuffer(entries) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];
    archive.on('data', (c) => chunks.push(c));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
    for (const entry of entries) {
      archive.append(entry.buffer, { name: entry.path });
    }
    archive.finalize();
  });
}

/**
 * Render MANY report cards into a ZIP archive, one PDF per student, organized as:
 *
 *   <Class A>/<Student 1>.pdf
 *   <Class A>/<Student 2>.pdf
 *   <Class B>/<Student 1>.pdf
 *   …
 *
 * Classes are sorted alphabetically and, within each class, students are sorted
 * by full name (alphabetical) — an organized archive an admin can hand out.
 * Renders happen with a bounded concurrency (the shared browser caps actual
 * parallel page.pdf() calls), so large exports still complete in good time.
 *
 * @param {Array<object>} payloads — report card payloads
 * @param {object} [options] — shared render options
 * @returns {Promise<Buffer>} ZIP buffer
 */
async function generateReportCardsZip(payloads = [], options = {}) {
  const { onProgress } = options;
  const total = payloads.length;
  let processed = 0;

  const groups = new Map();
  for (const p of payloads) {
    const className = sanitizeFileName(p.student?.class_name || (options.unknownClassLabel || 'No class'));
    if (!groups.has(className)) groups.set(className, []);
    groups.get(className).push(p);
  }

  const sortedClasses = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const entries = [];

  for (const [className, classPayloads] of sortedClasses) {
    const sortedStudents = [...classPayloads].sort((a, b) =>
      (a.student?.full_name || '').localeCompare(b.student?.full_name || '')
    );

    // Render each PDF but never let ONE student's render failure kill the
    // whole archive — skip it and log (mirrors the payload-loading guard in
    // the controller).
    const rendered = await mapWithConcurrency(sortedStudents, 6, async (p) => {
      let buffer = null;
      try {
        buffer = await generateReportCardPdf(p, options);
      } catch (err) {
        logger.warn(`[ReportCardPdf] Skipping ${p.student?.full_name || p.report_card_id} in ZIP export: ${err.message}`);
      }
      processed++;
      onProgress?.({ current: processed, total });
      return { payload: p, buffer };
    });

    // Dedupe filenames: two students with the SAME full name in one class
    // must not overwrite each other in the archive (silent data loss).
    const usedNames = new Set();
    for (const item of rendered) {
      if (!item.buffer) continue; // render failed — already logged above
      const base = sanitizeFileName(item.payload.student?.full_name || 'student');
      let studentName = base;
      let counter = 2;
      while (usedNames.has(studentName)) {
        studentName = `${base}-${counter++}`;
      }
      usedNames.add(studentName);
      entries.push({ path: `${className}/${studentName}.pdf`, buffer: item.buffer });
    }
  }

  if (entries.length === 0) {
    throw new Error('No report card PDFs could be rendered for this export');
  }

  return buildZipBuffer(entries);
}

/** Gracefully close the shared browser (call on server shutdown). */
async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    browserPromise = null;
    if (browser) {
      await browser.close().catch((err) => logger.warn('[ReportCardPdf] Browser close error:', err.message));
    }
  }
}

module.exports = {
  renderReportCardHtml,
  renderReportCardsHtml,
  generateReportCardPdf,
  generateReportCardsPdf,
  generateReportCardsZip,
  closeBrowser,
  // exposed for tests
  _resolveExecutablePath: resolveExecutablePath,
};
