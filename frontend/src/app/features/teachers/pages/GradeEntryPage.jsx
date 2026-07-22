/**
 * GradeEntryPage — Teacher grade/marks entry interface.
 *
 * Features:
 *  - Select class → select subject → select period
 *  - List of students with score input fields
 *  - Bulk save with validation
 *  - Visual score color coding (pass/fail/at-risk)
 *
 * Route: /dashboard/grade-entry
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { getEnrollments } from "../../../core/api/enrollmentService";
import { getTeacherSubjects } from "../../../core/api/subjectService";
import { getTeacherClasses } from "../../../core/api/classService";
import { getClassGrades, recordGrade, updateGrade } from "../../../core/api/gradeService";
import periodService from "../../../core/api/periodService";
import sequencesService from "../../../core/api/sequencesService";
import {
  BookOpen,
  Users,
  Save,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Search,
  GraduationCap,
  Bookmark,
  CalendarDays,
  Lock,
  Clock,
} from "lucide-react";

// ── Score color helpers ──
function scoreColor(score, max = 20) {
  const pct = (score / max) * 100;
  if (pct >= 60) return { text: "#1D9E75", bg: "rgba(29,158,117,.08)" };
  if (pct >= 40) return { text: "#F59E0B", bg: "rgba(245,158,11,.08)" };
  return { text: "#EF4444", bg: "rgba(239,68,68,.08)" };
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function GradeEntryPage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const { t } = useTranslation('common');
  const pc = primaryColor || "#085041";

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [existingGrades, setExistingGrades] = useState({});

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [search, setSearch] = useState("");

  // ── Period / Sequence state ──
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [sequences, setSequences] = useState([]);
  const [selectedSequenceId, setSelectedSequenceId] = useState("");
  const [sequenceDateWarning, setSequenceDateWarning] = useState(null);
  const [sequenceStatusWarning, setSequenceStatusWarning] = useState(null);

  // Scores keyed by studentId
  const [scores, setScores] = useState({});

  // ── Check date / status warnings for selected sequence ──
  useEffect(() => {
    if (!selectedSequenceId) {
      setSequenceDateWarning(null);
      setSequenceStatusWarning(null);
      return;
    }
    const seq = sequences.find((s) => s.id === selectedSequenceId);
    if (!seq) return;

    // Status check
    if (seq.statut !== "OUVERTE") {
      const statusLabels = {
        EN_ATTENTE: "En attente",
        OUVERTE: "Ouverte",
        FERMEE: "Fermée",
        VERROUILLEE: "Vérouillée",
      };
      setSequenceStatusWarning(
        `Cette séquence est « ${statusLabels[seq.statut] || seq.statut} ». Les notes ne peuvent être saisies que dans une séquence ouverte.`
      );
    } else {
      setSequenceStatusWarning(null);
    }

    // Date check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = seq.dateDebutSaisie ? new Date(seq.dateDebutSaisie) : null;
    const end = seq.dateFinSaisie ? new Date(seq.dateFinSaisie) : null;

    if (start && end) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      if (today < start) {
        setSequenceDateWarning(
          `La saisie débutera le ${start.toLocaleDateString('fr-FR')}`
        );
      } else if (today > end) {
        setSequenceDateWarning(
          `La période de saisie est terminée (fin le ${end.toLocaleDateString('fr-FR')})`
        );
      } else {
        setSequenceDateWarning(null);
      }
    }
  }, [selectedSequenceId, sequences]);

  // ── Load teacher's classes & subjects + periods ──
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const teacherId = user?.id;
      if (!teacherId) return;

      // Load teacher's assigned classes + subjects + periods in parallel
      const [classesData, subjectData, periodsData] = await Promise.all([
        getTeacherClasses(teacherId).catch(() => []),
        getTeacherSubjects(teacherId).catch(() => []),
        periodService.list().catch(() => []),
      ]);

      const classesList = Array.isArray(classesData) ? classesData : (classesData?.data || []);
      const subjectsList = Array.isArray(subjectData) ? subjectData : (subjectData?.data || []);

      setClasses(classesList);
      setSubjects(subjectsList);
      setPeriods(periodsData);

      // Auto-select the class if only one is assigned
      if (classesList.length === 1) {
        setSelectedClassId(classesList[0].id);
      }

      // Auto-select the current/active period
      const currentPeriod = periodsData.find((p) => p.isCurrent);
      if (currentPeriod) {
        setSelectedPeriodId(currentPeriod.id);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load your classes and subjects");
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // ── Load sequences when period changes ──
  useEffect(() => {
    if (!selectedPeriodId) {
      setSequences([]);
      setSelectedSequenceId("");
      return;
    }
    async function load() {
      try {
        const seqData = await sequencesService.getByPeriodeId(selectedPeriodId);
        setSequences(seqData);
        // Auto-select the first open sequence, or the first sequence
        const openSeq = seqData.find((s) => s.statut === "OUVERTE");
        if (openSeq) {
          setSelectedSequenceId(openSeq.id);
        } else if (seqData.length > 0) {
          setSelectedSequenceId(seqData[0].id);
        }
      } catch {
        setSequences([]);
      }
    }
    load();
  }, [selectedPeriodId]);

  // ── When class changes, load students ──
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setScores({});
      setExistingGrades({});
      return;
    }
    async function load() {
      try {
        const [enrollData] = await Promise.all([
          getEnrollments({ classId: selectedClassId, status: "active", limit: 500 }),
        ]);
        const studentList = (enrollData?.enrollments || []).map((e) => ({
          id: e.studentId,
          fullName: e.studentName || "Unknown",
          className: e.className || "",
        }));

        setStudents(studentList);

        // Load existing grades for the selected class + subject (+ period)
        if (selectedSubjectId) {
          const gradeData = await getClassGrades(selectedClassId).catch(() => []);
          const grades = Array.isArray(gradeData) ? gradeData : gradeData?.grades || [];
          const gradeMap = {};
          grades.forEach((g) => {
            const matchSubject = String(g.subjectId) === String(selectedSubjectId);
            const matchPeriod = !selectedPeriodId || String(g.periodId) === String(selectedPeriodId);
            if (matchSubject && matchPeriod) {
              gradeMap[g.studentId] = { id: g.id, score: Number(g.score), comment: g.comment };
            }
          });
          setExistingGrades(gradeMap);

          // Pre-fill scores from existing grades (filtered by period)
          const initScores = {};
          studentList.forEach((s) => {
            if (gradeMap[s.id]) initScores[s.id] = gradeMap[s.id].score;
          });
          setScores(initScores);
        } else {
          setExistingGrades({});
          setScores({});
        }
      } catch {
        setStudents([]);
      }
    }
    load();
  }, [selectedClassId, selectedSubjectId, selectedPeriodId]);

  // ── When class changes, filter available subjects ──
  const availableSubjects = selectedClassId
    ? subjects.filter((s) => String(s.classId) === String(selectedClassId))
    : [];

  // ── Set score for a student ──
  const setScore = (studentId, value) => {
    const num = parseFloat(value);
    if (value === "" || value === undefined || value === null) {
      const updated = { ...scores };
      delete updated[studentId];
      setScores(updated);
    } else if (!isNaN(num) && num >= 0 && num <= 20) {
      setScores((prev) => ({ ...prev, [studentId]: num }));
    }
  };

  // ── Save all grades ──
  const handleSaveAll = async () => {
    if (!selectedSubjectId || !selectedClassId || !selectedPeriodId || !selectedSequenceId) {
      setError(t('teacher.gradeEntry.saveError'));
      return;
    }
    if (Object.keys(scores).length === 0) {
      setError(t('teacher.gradeEntry.scoreError'));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const entries = Object.entries(scores);
      let saved = 0;

      for (const [studentId, score] of entries) {
        const existing = existingGrades[studentId];
        if (existing) {
          await updateGrade(existing.id, { score, comment: "" });
        } else {
          await recordGrade({
            studentId,
            subjectId: selectedSubjectId,
            periodId: selectedPeriodId || undefined,
            score,
            comment: "",
          });
        }
        saved++;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save grades:", err);
      setError(err.response?.data?.message || err.message || "Failed to save grades");
    }
    setSaving(false);
  };

  const filteredStudents = students.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes grFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gr-fade { animation: grFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="gr-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
            {t('teacher.gradeEntry.title')}
          </h1>
          <p className="text-white/70 text-sm">
            {t('teacher.gradeEntry.subtitle')}
          </p>
        </div>
      </div>

      {/* ── Selectors Row 1: Class · Subject · Search ── */}
      <div className="gr-fade grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ animationDelay: "0.06s" }}>
        {/* Class selector */}
        <div className="relative">
          <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <select
            value={selectedClassId}
            onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(""); }}
            className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
          >
            <option value="">{t('teacher.gradeEntry.selectClass')}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        </div>

        {/* Subject selector */}
        <div className="relative">
          <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={!selectedClassId}
            className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">{t('teacher.gradeEntry.selectSubject')}</option>
            {availableSubjects.map((s) => (
              <option key={s.subjectId || s.id} value={s.subjectId || s.id}>
                {s.subjectName || s.name}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('teacher.gradeEntry.searchStudents')}
            disabled={!selectedClassId}
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* ── Selectors Row 2: Period · Sequence ── */}
      <div className="gr-fade grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ animationDelay: "0.08s" }}>
        {/* Period selector */}
        <div className="relative">
          <CalendarDays size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <select
            value={selectedPeriodId}
            onChange={(e) => { setSelectedPeriodId(e.target.value); setSelectedSubjectId(""); }}
            className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
          >
            <option value="">{t('teacher.gradeEntry.selectPeriod')}</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.isCurrent ? '★ ' : ''}{p.name}
                {p.startDate ? ` (${new Date(p.startDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}` : ''}
                {p.endDate ? ` - ${new Date(p.endDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })})` : ''}
                {p.isCurrent ? ` — ${t('teacher.gradeEntry.currentPeriod')}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        </div>

        {/* Sequence selector */}
        <div className="relative">
          <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <select
            value={selectedSequenceId}
            onChange={(e) => setSelectedSequenceId(e.target.value)}
            disabled={!selectedPeriodId || sequences.length === 0}
            className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">{t('teacher.gradeEntry.selectSequence')}</option>
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
                {s.statut === 'OUVERTE' ? ' (Ouverte)' : s.statut === 'FERMEE' ? ' (Fermée)' : s.statut === 'VERROUILLEE' ? ' (Verrouillée)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Current period/sequence info banner ── */}
      {selectedPeriodId && selectedSequenceId && (
        <div
          className="gr-fade flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border"
          style={{
            background: 'rgba(8,80,65,0.05)',
            borderColor: 'rgba(8,80,65,0.15)',
            color: '#085041',
            animationDelay: '0.085s',
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(8,80,65,0.1)' }}>
            <Bookmark size={16} />
          </div>
          <div className="flex-1">
            <span className="font-semibold">
              {t('teacher.gradeEntry.savingIn')}
            </span>{' '}
            <span style={{ opacity: 0.8 }}>
              {periods.find((p) => p.id === selectedPeriodId)?.name || t('teacher.gradeEntry.periodSelected')}
              {selectedSequenceId && sequences.find((s) => s.id === selectedSequenceId)
                ? ` / ${sequences.find((s) => s.id === selectedSequenceId)?.libelle || ''}`
                : ''}
            </span>
          </div>
          {selectedSequenceId && (() => {
            const seq = sequences.find((s) => s.id === selectedSequenceId);
            if (!seq) return null;
            const statusColors = {
              OUVERTE: { bg: 'rgba(29,158,117,0.1)', text: '#1D9E75' },
              FERMEE: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444' },
              VERROUILLEE: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
              EN_ATTENTE: { bg: 'rgba(156,163,175,0.1)', text: '#9CA3AF' },
            };
            const sc = statusColors[seq.statut] || statusColors.EN_ATTENTE;
            return (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{ background: sc.bg, color: sc.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.text }} />
                {seq.statut === 'OUVERTE' ? t('teacher.gradeEntry.statusOpen') : seq.statut === 'FERMEE' ? t('teacher.gradeEntry.statusClosed') : seq.statut === 'VERROUILLEE' ? t('teacher.gradeEntry.statusLocked') : t('teacher.gradeEntry.statusPending')}
              </span>
            );
          })()}
        </div>
      )}

      {/* ── Sequence warnings ── */}
      {(sequenceDateWarning || sequenceStatusWarning) && (
        <div className="gr-fade space-y-2" style={{ animationDelay: "0.09s" }}>
          {sequenceDateWarning && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium" style={{
              background: sequenceDateWarning.startsWith('La période') ? 'rgba(239,68,68,0.06)' : 'rgba(59,130,246,0.06)',
              border: `1.5px solid ${sequenceDateWarning.startsWith('La période') ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
              color: sequenceDateWarning.startsWith('La période') ? '#EF4444' : '#3B82F6',
            }}>
              <Clock size={14} className="flex-shrink-0" />
              <span>{sequenceDateWarning}</span>
            </div>
          )}
          {sequenceStatusWarning && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium" style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1.5px solid rgba(245,158,11,0.2)',
              color: '#F59E0B',
            }}>
              <Lock size={14} className="flex-shrink-0" />
              <span>{sequenceStatusWarning}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Stats bar (requires all 4 selections) ── */}
      {selectedClassId && selectedSubjectId && selectedPeriodId && selectedSequenceId && students.length > 0 && (
        <div className="gr-fade grid grid-cols-3 gap-3" style={{ animationDelay: "0.1s" }}>
          {[
            { icon: Users, value: students.length, label: t('teacher.gradeEntry.students'), color: "#3B82F6" },
            { icon: Bookmark, value: availableSubjects.length, label: t('teacher.gradeEntry.subjects'), color: "#8B5CF6" },
            { icon: CheckCircle2, value: Object.keys(scores).length, label: t('teacher.gradeEntry.gradesEntered'), color: "#1D9E75" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.color}15` }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-[18px] font-extrabold text-surface-900 dark:text-surface-100">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-surface-400">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Student grade grid (requires all 4 selections) ── */}
      {selectedClassId && selectedSubjectId && selectedPeriodId && selectedSequenceId && (
        <div className="gr-fade" style={{ animationDelay: "0.14s" }}>
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
            {/* Column headers */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-3 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-700">
              <div className="w-8" />
              <div className="flex-1 text-[11px] font-semibold tracking-wider uppercase text-surface-400">
                {t('teacher.gradeEntry.students')}
              </div>
              <div className="w-24 text-center text-[11px] font-semibold tracking-wider uppercase text-surface-400">
                {t('teacher.gradeEntry.score')}
              </div>
              <div className="w-16 text-center text-[11px] font-semibold tracking-wider uppercase text-surface-400">
                {t('teacher.gradeEntry.status')}
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={32} className="text-surface-200 dark:text-surface-600 mb-3" />
                <p className="text-sm font-medium text-surface-400">
                  {search ? t('teacher.gradeEntry.noSearchResults') : t('teacher.gradeEntry.noStudents')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
                {filteredStudents.map((student, idx) => {
                  const score = scores[student.id];
                  const existing = existingGrades[student.id];
                  const colors = score ? scoreColor(score) : { text: "#9BA59C", bg: "transparent" };

                  return (
                    <div
                      key={student.id}
                      className="gr-fade flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                        style={{
                          background: existing ? `${colors.text}20` : "#E1F5EE",
                          color: existing ? colors.text : "#085041",
                        }}
                      >
                        {initials(student.fullName)}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate">
                          {student.fullName}
                        </div>
                        <div className="text-[11px] text-surface-400">
                          {existing ? t('teacher.gradeEntry.updateGrade') : t('teacher.gradeEntry.newGrade')}
                        </div>
                      </div>

                      {/* Score input */}
                      <div className="w-24 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={score !== undefined ? score : ""}
                          onChange={(e) => setScore(student.id, e.target.value)}
                          placeholder="--"
                          className="w-full h-9 text-center text-[14px] font-extrabold bg-surface-50 dark:bg-surface-900 border-[1.5px] rounded-lg focus:outline-none focus:border-primary-400 transition-colors"
                          style={{
                            borderColor: score ? colors.text + "40" : "var(--surface-100)",
                            color: score ? colors.text : "var(--surface-400)",
                          }}
                        />
                      </div>

                      {/* Status indicator */}
                      <div className="w-16 flex justify-center flex-shrink-0">
                        {score !== undefined && (
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: colors.text }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer actions ── */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {error && (
                <span className="text-[12px] font-medium text-red-500 flex items-center gap-1">
                  <AlertCircle size={13} />
                  {error}
                </span>
              )}
              {success && (
                <span className="text-[12px] font-medium text-teal-600 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  {t('teacher.gradeEntry.savedSuccess')}
                </span>
              )}
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving || Object.keys(scores).length === 0}
              className="h-10 px-5 rounded-xl text-white text-[13px] font-semibold transition-all hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              style={{ background: pc }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('teacher.gradeEntry.saving')}
                </>
              ) : (
                <>
                  <Save size={15} />
                  {t('teacher.gradeEntry.saveAll')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Empty states ── */}
      {!loading && !selectedClassId && (
        <div className="gr-fade flex flex-col items-center justify-center py-16 text-center" style={{ animationDelay: "0.12s" }}>
          <div className="w-20 h-20 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-5 border-2 border-dashed border-surface-200 dark:border-surface-600">
            <BookOpen size={32} className="text-surface-300 dark:text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
            {t('teacher.gradeEntry.selectClass')}
          </h3>
          <p className="text-sm text-surface-400 max-w-sm">
            {t('teacher.gradeEntry.selectHint')}
          </p>
        </div>
      )}
      {!loading && selectedClassId && selectedSubjectId && (!selectedPeriodId || !selectedSequenceId) && (
        <div className="gr-fade flex flex-col items-center justify-center py-12 text-center" style={{ animationDelay: "0.12s" }}>
          <div className="w-16 h-16 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-4 border-2 border-dashed border-surface-200 dark:border-surface-600">
            <CalendarDays size={24} className="text-surface-300" />
          </div>
          <h3 className="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">
            {t('teacher.gradeEntry.selectPeriod')}
          </h3>
          <p className="text-sm text-surface-400 max-w-sm">
            Sélectionnez une période et une séquence pour commencer la saisie des notes.
          </p>
        </div>
      )}
    </div>
  );
}
