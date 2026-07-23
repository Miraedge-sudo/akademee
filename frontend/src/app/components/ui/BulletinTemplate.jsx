/**
 * BulletinTemplate — Education-system-aware report card renderer.
 *
 * Renders a beautiful, print-ready bulletin template that adapts to the
 * education system (ANG_GEN, FR_GEN, ANG_TECH, FR_TECH, UNIV) and period
 * type (SEQUENTIEL, TRIMESTRIEL, ANNUEL) based on the backend payload.
 *
 * ALL display configuration comes from the backend payload via
 * `payload.education_system_config` — the backend is the sole source of truth.
 *
 * Design extracted from frontend/public/new/bulletin-designs.html
 */
import { useMemo } from "react";

// ── Shared constants (not system-specific) ──
const REMARKS_FR = ["Excellent trimestre", "Peut mieux faire", "Travail satisfaisant", "Efforts à poursuivre", "Bon ensemble"];
const REMARKS_EN = ["Excellent effort", "Can do better", "Satisfactory work", "Needs more effort", "Good overall"];

const HEADER_CELL_STYLE = {
  border: "1px solid #c9c6ba",
  background: "rgba(0,0,0,.05)",
  fontWeight: 700,
  fontSize: "10.5px",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  padding: "6px 7px",
  textAlign: "center",
};

function mapPeriodType(backendType) {
  const t = (backendType || "").toLowerCase();
  if (t === "sequence" || t === "sequentiel") return "SEQUENTIEL";
  if (t === "term" || t === "trimestre" || t === "quarter" || t === "semester") return "TRIMESTRIEL";
  if (t === "annual" || t === "academic_year" || t === "annuel") return "ANNUEL";
  return "SEQUENTIEL";
}

function scoreColor(score) {
  const pct = (score / 20) * 100;
  if (pct >= 60) return "#1D9E75";
  if (pct >= 40) return "#F59E0B";
  return "#EF4444";
}

// ── Helper: pick best label from bilingual data ──
function pickLabel(lang, fr, en) {
  if (lang === 'FR') return fr || en || '';
  if (lang === 'EN') return en || fr || '';
  return en || fr || '';
}

// ── Sub-components ──
// All receive `eduConfig` (from payload.education_system_config) instead of `sysKey`

function Letterhead({ eduConfig, schoolInfo }) {
  const fr = eduConfig?.lang === "fr";
  const hasLogo = schoolInfo?.logoUrl;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "16px",
      borderBottom: "2px solid #1c1c1a", paddingBottom: "14px", marginBottom: "16px",
    }}>
      {hasLogo ? (
        <img
          src={schoolInfo.logoUrl}
          alt={schoolInfo.name || "Logo"}
          style={{
            width: "56px", height: "56px", borderRadius: "50%",
            objectFit: "cover", border: "2px solid #1c1c1a",
            flexShrink: 0,
          }}
          crossOrigin="anonymous"
        />
      ) : (
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          border: "2px solid #1c1c1a", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.03em",
          textAlign: "center", lineHeight: "1.15",
        }}>
          R.C.<br />{fr ? <>RÉP. DU<br/>CAMEROUN</> : <>REP. OF<br/>CAMEROON</>}
        </div>
      )}
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.02em" }}>
          {fr ? "RÉPUBLIQUE DU CAMEROUN" : "REPUBLIC OF CAMEROON"}
        </div>
        <div style={{ fontSize: "10.5px", fontStyle: "italic", color: "#4a4a45", marginTop: "1px" }}>
          {fr ? "Paix – Travail – Patrie" : "Peace – Work – Fatherland"}
        </div>
        <div style={{ fontSize: "11.5px", marginTop: "6px", fontWeight: 600 }}>
          {fr ? eduConfig?.ministry_fr : eduConfig?.ministry_en}
        </div>
      </div>
      <div style={{
        flexShrink: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.05em", padding: "5px 9px", borderRadius: "3px",
        color: "#fff", whiteSpace: "nowrap", background: eduConfig?.accent || "#1B6B3C",
      }}>
        {pickLabel(eduConfig?.lang, eduConfig?.name_fr, eduConfig?.name_en)}
      </div>
    </div>
  );
}

function DocTitle({ eduConfig, periodType, periodIndex, className, schoolName, schoolInfo, sequenceLabel }) {
  const fr = eduConfig?.lang === "fr";
  const plabels = eduConfig?.period_labels?.[periodType] || {};
  const isUniv = eduConfig?.is_university;
  const count = plabels.count || 1;
  const periodNoun = isUniv
    ? (periodType === "ANNUEL" ? (fr ? "Année" : "Year") : (fr ? "N°" : "No."))
    : (fr ? `${plabels.unit_fr || ''} n°` : `${plabels.unit_en || ''} No.`);
  const name = schoolInfo?.name || schoolName || "Établissement";
  const city = schoolInfo?.city ? ` — ${schoolInfo.city}` : "";

  return (
    <>
      <div style={{
        textAlign: "center", fontSize: "16px", fontWeight: 700,
        letterSpacing: "0.03em", textTransform: "uppercase", margin: "14px 0 4px",
      }}>
        {pickLabel(eduConfig?.lang, plabels.doc_fr, plabels.doc_en)}
      </div>
      <div style={{ textAlign: "center", fontSize: "11.5px", color: "#4a4a45", marginBottom: "16px" }}>
        {name}{city}{className ? ` — ${className}` : ""} — {fr ? "Année Scolaire" : "Academic Year"} {new Date().getFullYear() - 1}/{new Date().getFullYear()}
        {count > 1 ? ` — ${periodNoun} ${periodIndex + 1}/${count}` : ""}
        {sequenceLabel ? ` — ${sequenceLabel}` : ""}
      </div>
    </>
  );
}

function IdentityBlock({ student, className, eduConfig }) {
  const fr = eduConfig?.lang === "fr";
  const isUniv = eduConfig?.is_university;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 26px",
      fontSize: "12px", border: "1px solid #c9c6ba", padding: "12px 16px",
      marginBottom: "18px", background: "rgba(0,0,0,.015)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #c9c6ba", padding: "3px 0" }}>
        <b style={{ fontWeight: 400, color: "#4a4a45" }}>{fr ? (isUniv ? "Nom & Prénom" : "Nom de l'élève") : "Student's name"}</b>
        <span style={{ fontWeight: 600 }}>{student?.full_name || "—"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #c9c6ba", padding: "3px 0" }}>
        <b style={{ fontWeight: 400, color: "#4a4a45" }}>{fr ? "Matricule" : "Registration No."}</b>
        <span style={{ fontWeight: 600 }}>{student?.registration_number || student?.id?.slice(0, 8) || "—"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #c9c6ba", padding: "3px 0" }}>
        <b style={{ fontWeight: 400, color: "#4a4a45" }}>{fr ? (isUniv ? "Filière" : "Classe") : "Class"}</b>
        <span style={{ fontWeight: 600 }}>{className || "—"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #c9c6ba", padding: "3px 0" }}>
        <b style={{ fontWeight: 400, color: "#4a4a45" }}>{fr ? "Sexe" : "Sex"}</b>
        <span style={{ fontWeight: 600 }}>{student?.gender || "—"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #c9c6ba", padding: "3px 0" }}>
        <b style={{ fontWeight: 400, color: "#4a4a45" }}>{fr ? "Né(e) le" : "Date of birth"}</b>
        <span style={{ fontWeight: 600 }}>{student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString(fr ? "fr-FR" : "en-GB") : "—"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #c9c6ba", padding: "3px 0" }}>
        <b style={{ fontWeight: 400, color: "#4a4a45" }}>{fr ? "Redoublant(e)" : "Repeater"}</b>
        <span style={{ fontWeight: 600 }}>{fr ? "Non" : "No"}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SubjectTable — the main grade table
// ═══════════════════════════════════════════════════

function SubjectTable({ subjects, eduConfig, periodType }) {
  const fr = eduConfig?.lang === "fr";
  const isUniv = eduConfig?.is_university;

  // Determine grading mode: split (theory/practical), standard (CA/Exam), or simple
  const hasSplitScores = subjects.some(s => s.theoryScore != null || s.practicalScore != null);
  const hasComponentScores = subjects.some(s => s.caScore != null || s.examScore != null);
  const isSplitMode = hasSplitScores && eduConfig?.is_university === false &&
    (eduConfig?.code === "ANG_TECH" || eduConfig?.code === "FR_TECH");

  // ── Table cell styles ──
  const th = (label, extraStyle = {}) => (
    <th style={{ ...HEADER_CELL_STYLE, ...extraStyle }} key={label}>{label}</th>
  );

  // Build table header
  let headerCells;
  if (isUniv) {
    headerCells = (
      <tr key="header-univ">
        {th(fr ? "Unité d'Enseignement" : "Course Unit", { textAlign: "left", width: "32%" })}
        {th(fr ? "Crédits" : "Credits", { width: "10%" })}
        {hasComponentScores && th(fr ? "CC (40%)" : "CA (40%)", { width: "14%" })}
        {hasComponentScores && th(fr ? "Examen (60%)" : "Exam (60%)", { width: "14%" })}
        {th(fr ? "Note /20" : "Grade /20", { width: "14%" })}
        {th(fr ? "Résultat" : "Result", { width: "16%" })}
      </tr>
    );
  } else if (periodType === "SEQUENTIEL") {
    headerCells = (
      <tr key="header-sequentiel">
        {th(fr ? "Matière" : "Subject", { textAlign: "left", width: isSplitMode ? "24%" : "26%" })}
        {isSplitMode ? th(fr ? "Théorie" : "Theory", { width: "12%" }) : th(fr ? "C.C. (30%)" : "CA (30%)", { width: "12%" })}
        {isSplitMode ? th(fr ? "Pratique" : "Practical", { width: "12%" }) : th(fr ? "Examen (70%)" : "Exam (70%)", { width: "12%" })}
        {th(fr ? "Moy./20" : "Avg./20", { width: "12%" })}
        {th(fr ? "Coef." : "Coef.", { width: "8%" })}
        {th(fr ? "Moy.×Coef." : "Total Pts", { width: "12%" })}
        {th(fr ? "Rang" : "Rank", { width: "8%" })}
        {th(fr ? "Appréciation" : "Remark", { textAlign: "left", width: "16%" })}
      </tr>
    );
  } else if (periodType === "TRIMESTRIEL") {
    headerCells = (
      <tr key="header-trimestriel">
        {th(fr ? "Matière" : "Subject", { textAlign: "left", width: "28%" })}
        {th(fr ? "Séq.1" : "Seq.1", { width: "12%" })}
        {th(fr ? "Séq.2" : "Seq.2", { width: "12%" })}
        {th(fr ? "Moy. Trim./20" : "Term Avg./20", { width: "14%" })}
        {th(fr ? "Coef." : "Coef.", { width: "10%" })}
        {th(fr ? "Total Pts" : "Total Pts", { width: "12%" })}
        {th(fr ? "Rang" : "Rank", { width: "12%" })}
      </tr>
    );
  } else {
    // ANNUEL
    headerCells = (
      <tr key="header-annuel">
        {th(fr ? "Matière" : "Subject", { textAlign: "left", width: "26%" })}
        {th(fr ? "Trim.1" : "Term 1", { width: "10%" })}
        {th(fr ? "Trim.2" : "Term 2", { width: "10%" })}
        {th(fr ? "Trim.3" : "Term 3", { width: "10%" })}
        {th(fr ? "Moy. Ann./20" : "Annual Avg./20", { width: "14%" })}
        {th(fr ? "Coef." : "Coef.", { width: "10%" })}
        {th(fr ? "Total Pts" : "Total Pts", { width: "10%" })}
        {th(fr ? "Rang" : "Rank", { width: "10%" })}
      </tr>
    );
  }

  // Build table body row
  function buildRow(subj, i) {
    const na = subj.score == null;
    const avgCell = na ? (
      <span style={{ color: "#4a4a45", fontStyle: "italic" }}>—</span>
    ) : (
      <b style={{ color: scoreColor(subj.score) }}>{subj.score.toFixed(1)}</b>
    );

    const hasRemark = subj.teacherRemark;
    const arr = fr ? REMARKS_FR : REMARKS_EN;
    const remark = hasRemark || arr[i % arr.length];

    const cellStyle = {
      border: "1px solid #c9c6ba",
      padding: "6px 7px",
      textAlign: "center",
      fontSize: "11.5px",
    };
    const subjectCellStyle = { ...cellStyle, textAlign: "left", fontWeight: 600 };

    const naRowStyle = na ? { color: "#4a4a45", fontStyle: "italic" } : {};
    // Fallback display name — never show blank
    const displayName = subj.name || subj.subjectCode || subj.nameFr || subj.nameEn || `Subject #${i + 1}`;

    if (isUniv) {
      const validated = !na && subj.score >= 10;
      return (
        <tr key={i} style={naRowStyle}>
          <td style={subjectCellStyle}>{displayName}</td>
          <td style={cellStyle}>{subj.coefficient || subj.credits || "—"}</td>
          {hasComponentScores && <td style={cellStyle}>{subj.caScore != null ? subj.caScore.toFixed(1) : "—"}</td>}
          {hasComponentScores && <td style={cellStyle}>{subj.examScore != null ? subj.examScore.toFixed(1) : "—"}</td>}
          <td style={cellStyle}><b>{avgCell}</b></td>
          <td style={{ ...cellStyle, color: na ? "inherit" : validated ? "#1B6B3C" : "#9B2C2C", fontWeight: 600 }}>
            {na ? "—" : (validated ? (fr ? "Validé" : "Passed") : (fr ? "Non validé" : "Failed"))}
          </td>
        </tr>
      );
    }

    if (periodType === "SEQUENTIEL") {
      const showCa = subj.caScore != null;
      const showExam = subj.examScore != null;
      const showTheory = subj.theoryScore != null;
      const showPractical = subj.practicalScore != null;
      const hasAnyComp = showCa || showExam || showTheory || showPractical;

      return (
        <tr key={i} style={naRowStyle}>
          <td style={subjectCellStyle}>{displayName}</td>
          {isSplitMode ? (
            <>
              <td style={cellStyle}>{showTheory ? subj.theoryScore.toFixed(1) : "—"}</td>
              <td style={cellStyle}>{showPractical ? subj.practicalScore.toFixed(1) : "—"}</td>
            </>
          ) : (
            <>
              <td style={cellStyle}>
                {showCa
                  ? <span>{subj.caScore.toFixed(1)}</span>
                  : hasAnyComp ? <span style={{ color: "#c9c6ba" }}>—</span> : <span style={{ color: "#c9c6ba" }}>—</span>
                }
              </td>
              <td style={cellStyle}>
                {showExam
                  ? <span>{subj.examScore.toFixed(1)}</span>
                  : hasAnyComp ? <span style={{ color: "#c9c6ba" }}>—</span> : <span style={{ color: "#c9c6ba" }}>—</span>
                }
              </td>
            </>
          )}
          <td style={cellStyle}>{avgCell}</td>
          <td style={cellStyle}>{subj.coefficient}</td>
          <td style={cellStyle}>{na ? "—" : subj.weightedPoints?.toFixed(1)}</td>
          <td style={cellStyle}>{subj.subjectRank || "—"}</td>
          <td style={{ ...cellStyle, textAlign: "left", fontStyle: "italic", color: "#4a4a45", fontSize: "11px" }}>
            {remark}
          </td>
        </tr>
      );
    }

    if (periodType === "TRIMESTRIEL") {
      return (
        <tr key={i} style={naRowStyle}>
          <td style={subjectCellStyle}>{displayName}</td>
          <td style={cellStyle}>—</td>
          <td style={cellStyle}>—</td>
          <td style={cellStyle}>{avgCell}</td>
          <td style={cellStyle}>{subj.coefficient}</td>
          <td style={cellStyle}>{na ? "—" : subj.weightedPoints?.toFixed(1)}</td>
          <td style={cellStyle}>{subj.subjectRank || "—"}</td>
        </tr>
      );
    }

    // ANNUEL
    return (
      <tr key={i} style={naRowStyle}>
        <td style={subjectCellStyle}>{displayName}</td>
        <td style={cellStyle}>—</td>
        <td style={cellStyle}>—</td>
        <td style={cellStyle}>—</td>
        <td style={cellStyle}>{avgCell}</td>
        <td style={cellStyle}>{subj.coefficient}</td>
        <td style={cellStyle}>{na ? "—" : subj.weightedPoints?.toFixed(1)}</td>
        <td style={cellStyle}>{subj.subjectRank || "—"}</td>
      </tr>
    );
  }

  // Determine caption
  const caption = fr
    ? `Résultats par ${isUniv ? "unité d'enseignement" : "matière"}`
    : `Results by ${isUniv ? "course unit" : "subject"}`;

  // Determine colSpan for empty state based on actual header count
  let emptyColSpan;
  if (isUniv) {
    emptyColSpan = 2 + (hasComponentScores ? 2 : 0) + 2;
  } else if (periodType === "SEQUENTIEL") {
    emptyColSpan = 8;
  } else if (periodType === "TRIMESTRIEL") {
    emptyColSpan = 7;
  } else {
    emptyColSpan = 8;
  }

  return (
    <table style={{
      width: "100%", borderCollapse: "collapse", fontSize: "11.5px", marginBottom: "14px",
    }}>
      <caption style={{
        textAlign: "left", fontSize: "11px", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.04em",
        padding: "6px 0", borderBottom: "1px solid #1c1c1a",
      }}>
        {caption}
      </caption>
      <thead>
        {headerCells}
      </thead>
      {subjects.length === 0 ? (
        <tbody>
          <tr>
            <td colSpan={emptyColSpan} style={{ textAlign: "center", padding: "20px", color: "#4a4a45", fontStyle: "italic", fontSize: "12px" }}>
              {fr ? "Aucune note disponible pour cette période" : "No grades available for this period"}
            </td>
          </tr>
        </tbody>
      ) : (
        <tbody>
          {subjects.map((subj, i) => buildRow(subj, i))}
        </tbody>
      )}
    </table>
  );
}

// ═══════════════════════════════════════════════════
// SummaryGrid, Attendance, Decision, Signatures, Footer
// ═══════════════════════════════════════════════════

function SummaryGrid({ summary, eduConfig }) {
  const fr = eduConfig?.lang === "fr";

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", margin: "16px 0",
    }}>
      <div style={{ border: "1px solid #1c1c1a", padding: "9px 10px", textAlign: "center" }}>
        <div style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#4a4a45" }}>
          {fr ? "Moyenne générale" : "Overall average"}
        </div>
        <div style={{ fontSize: "17px", fontWeight: 700, marginTop: "3px" }}>
          {summary?.general_average != null ? `${Number(summary.general_average).toFixed(2)}/20` : "—"}
        </div>
      </div>
      <div style={{ border: "1px solid #1c1c1a", padding: "9px 10px", textAlign: "center" }}>
        <div style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#4a4a45" }}>
          {fr ? "Rang" : "Rank"}
        </div>
        <div style={{ fontSize: "17px", fontWeight: 700, marginTop: "3px" }}>
          {summary?.class_rank || "—"}
        </div>
      </div>
      <div style={{ border: "1px solid #1c1c1a", padding: "9px 10px", textAlign: "center" }}>
        <div style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#4a4a45" }}>
          {fr ? "Moyenne de la classe" : "Class average"}
        </div>
        <div style={{ fontSize: "17px", fontWeight: 700, marginTop: "3px" }}>
          {summary?.class_average != null ? `${Number(summary.class_average).toFixed(2)}/20` : "—"}
        </div>
      </div>
      <div style={{ border: "1px solid #1c1c1a", padding: "9px 10px", textAlign: "center" }}>
        <div style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#4a4a45" }}>
          {fr ? "Mention" : "Remark"}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "3px" }}>
          {summary?.mention || "—"}
        </div>
      </div>
    </div>
  );
}

function AttendanceBand({ attendance, eduConfig }) {
  const fr = eduConfig?.lang === "fr";

  if (!attendance || (!attendance.total && !attendance.excused && !attendance.absent)) return null;

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: "20px",
      fontSize: "11.5px", margin: "14px 0", padding: "10px 0",
      borderTop: "1px solid #c9c6ba", borderBottom: "1px solid #c9c6ba",
    }}>
      <div>
        <b style={{ display: "block", fontSize: "9.5px", textTransform: "uppercase", color: "#4a4a45", fontWeight: 400, letterSpacing: "0.04em", marginBottom: "2px" }}>
          {fr ? "Conduite" : "Conduct"}
        </b>
        {fr ? "Bonne" : "Good"}
      </div>
      <div>
        <b style={{ display: "block", fontSize: "9.5px", textTransform: "uppercase", color: "#4a4a45", fontWeight: 400, letterSpacing: "0.04em", marginBottom: "2px" }}>
          {fr ? "Absences justifiées" : "Justified absences"}
        </b>
        {attendance.excused || 0}h
      </div>
      <div>
        <b style={{ display: "block", fontSize: "9.5px", textTransform: "uppercase", color: "#4a4a45", fontWeight: 400, letterSpacing: "0.04em", marginBottom: "2px" }}>
          {fr ? "Absences injustifiées" : "Unjustified absences"}
        </b>
        {attendance.absent || 0}h
      </div>
      <div>
        <b style={{ display: "block", fontSize: "9.5px", textTransform: "uppercase", color: "#4a4a45", fontWeight: 400, letterSpacing: "0.04em", marginBottom: "2px" }}>
          {fr ? "Retards" : "Late arrivals"}
        </b>
        {attendance.late || 0}
      </div>
      <div>
        <b style={{ display: "block", fontSize: "9.5px", textTransform: "uppercase", color: "#4a4a45", fontWeight: 400, letterSpacing: "0.04em", marginBottom: "2px" }}>
          {fr ? "Taux de présence" : "Attendance rate"}
        </b>
        {attendance.attendanceRate != null ? `${attendance.attendanceRate}%` : "—"}
      </div>
    </div>
  );
}

function DecisionBand({ periodType, eduConfig }) {
  if (periodType !== "ANNUEL") return null;
  const fr = eduConfig?.lang === "fr";
  const isUniv = eduConfig?.is_university;

  return (
    <div style={{
      textAlign: "center", fontSize: "12.5px", fontWeight: 700,
      padding: "9px", margin: "14px 0",
      border: "1.5px solid #1c1c1a",
    }}>
      {isUniv
        ? (fr ? "DÉCISION : ANNÉE VALIDÉE — PASSAGE EN NIVEAU SUPÉRIEUR" : "DECISION: YEAR VALIDATED — PROMOTED TO NEXT LEVEL")
        : (fr ? "DÉCISION DU CONSEIL DE CLASSE : ADMIS(E) EN CLASSE SUPÉRIEURE" : "CLASS COUNCIL DECISION: PROMOTED TO THE NEXT CLASS")}
    </div>
  );
}

function Signatures({ eduConfig }) {
  const fr = eduConfig?.lang === "fr";
  const isUniv = eduConfig?.is_university;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px",
      marginTop: "34px", fontSize: "11px", textAlign: "center", color: "#4a4a45",
    }}>
      <div style={{ borderTop: "1px solid #1c1c1a", marginTop: "38px", paddingTop: "5px" }}>
        {fr ? "Professeur Principal" : "Class Master"}
      </div>
      <div style={{ borderTop: "1px solid #1c1c1a", marginTop: "38px", paddingTop: "5px" }}>
        {fr ? "Parent / Tuteur" : "Parent / Guardian"}
      </div>
      <div style={{ borderTop: "1px solid #1c1c1a", marginTop: "38px", paddingTop: "5px" }}>
        {fr ? (isUniv ? "Le Doyen" : "Le Chef d'Établissement") : (isUniv ? "Dean" : "Principal")}
      </div>
    </div>
  );
}

function Footer({ eduConfig, schoolInfo }) {
  const fr = eduConfig?.lang === "fr";
  const now = new Date().toLocaleDateString(fr ? "fr-FR" : "en-GB");

  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      fontSize: "9.5px", color: "#4a4a45",
      marginTop: "22px", borderTop: "1px solid #c9c6ba", paddingTop: "8px",
    }}>
      <span>
        {fr ? "Édité le" : "Issued on"} {now}
        {schoolInfo?.phone ? ` — ${schoolInfo.phone}` : ""}
        {schoolInfo?.email ? ` — ${schoolInfo.email}` : ""}
      </span>
      <span>
        {fr
          ? "Document généré automatiquement — cachet et signature requis pour validité"
          : "System-generated document — stamp and signature required for validity"}
      </span>
    </div>
  );
}

// ── Print styles ──
const BULLETIN_PRINT_STYLES = `
  @media print {
    #bulletin-template {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    #bulletin-template * {
      box-shadow: none !important;
      text-shadow: none !important;
    }
    @page {
      size: A4 portrait;
      margin: 15mm 12mm;
    }
  }
`;

// ── Main Component ──

export default function BulletinTemplate({ payload, schoolName }) {
  // ── ALL display configuration comes from the backend payload ──
  // The backend sends `education_system_config` which contains:
  //   code, name_fr, name_en, lang, accent, is_university,
  //   ministry_fr, ministry_en, period_labels {SEQUENTIEL, TRIMESTRIEL, ANNUEL}
  const eduConfig = payload?.education_system_config || {};

  // When the report card was generated for a specific sequence (sequence_label exists),
  // force SEQUENTIEL regardless of the parent period type.
  const periodType = useMemo(() => {
    if (payload?.period?.sequence_label) return 'SEQUENTIEL';
    return mapPeriodType(payload?.period?.type);
  }, [payload?.period?.type, payload?.period?.sequence_label]);
  const periodIndex = 0;

  const subjects = payload?.subjects || [];
  const summary = payload?.summary || {};
  const attendance = payload?.attendance || null;
  const student = payload?.student || {};
  const className = student?.class_name || payload?.class_level?.class_name || "—";
  const schoolInfo = payload?.school_info || null;

  const watermark = schoolInfo?.name?.split(",")[0]?.split("—")[0]?.trim()
    || schoolName?.split(",")[0]?.split("—")[0]?.trim()
    || "AKADEMEE";

  return (
    <>
      <style>{BULLETIN_PRINT_STYLES}</style>
      <div
        id="bulletin-template"
        style={{
          background: "#FBFAF6",
          color: "#1c1c1a",
          fontFamily: "Georgia, 'Times New Roman', serif",
          borderRadius: "2px",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute", top: "52%", left: "50%",
          transform: "translate(-50%,-50%) rotate(-28deg)",
          fontSize: "64px", fontWeight: 700,
          color: "rgba(20,20,20,.045)",
          whiteSpace: "nowrap", pointerEvents: "none",
          letterSpacing: "0.05em", zIndex: 0,
        }}>
          {watermark}
        </div>

        <div style={{ position: "relative", padding: "34px 40px 30px", zIndex: 1 }}>
          <Letterhead eduConfig={eduConfig} schoolInfo={schoolInfo} />
          <DocTitle
            eduConfig={eduConfig}
            periodType={periodType}
            periodIndex={periodIndex}
            className={className}
            schoolName={schoolName}
            schoolInfo={schoolInfo}
            sequenceLabel={payload?.period?.sequence_label}
          />
          <IdentityBlock student={student} className={className} eduConfig={eduConfig} />
          <SubjectTable subjects={subjects} eduConfig={eduConfig} periodType={periodType} />
          <SummaryGrid summary={summary} eduConfig={eduConfig} />
          <AttendanceBand attendance={attendance} eduConfig={eduConfig} />
          <DecisionBand periodType={periodType} eduConfig={eduConfig} />
          <Signatures eduConfig={eduConfig} />
          <Footer eduConfig={eduConfig} schoolInfo={schoolInfo} />
        </div>
      </div>
    </>
  );
}
