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
import { getEnrollments } from "../../../core/api/enrollmentService";
import { getTeacherSubjects } from "../../../core/api/subjectService";
import { getClassGrades, recordGrade, updateGrade } from "../../../core/api/gradeService";
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

  // Scores keyed by studentId
  const [scores, setScores] = useState({});

  // ── Load teacher's classes & subjects ──
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const teacherId = user?.id;
      if (!teacherId) return;

      // Get teacher's subject assignments to determine their classes
      const subjectData = await getTeacherSubjects(teacherId).catch(() => []);
      const subjectsList = Array.isArray(subjectData) ? subjectData : subjectData?.data || [];

      // Get all classes to resolve class names
      const { getClasses } = await import("../../../core/api/classService");
      const allClassesData = await getClasses({ limit: 200 }).catch(() => ({ classes: [] }));
      const allClasses = allClassesData?.classes || [];
      const classLookup = {};
      allClasses.forEach((c) => { classLookup[c.id] = c.name; });

      // Extract unique classes from subject assignments
      const classMap = {};
      subjectsList.forEach((s) => {
        const cid = s.classId;
        if (cid && !classMap[cid]) {
          classMap[cid] = { id: cid, name: classLookup[cid] || s.className || cid.slice(0, 8) };
        }
      });
      const classesList = Object.values(classMap);

      setClasses(classesList);
      setSubjects(subjectsList);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load your classes and subjects");
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

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

        // Load existing grades for the selected class + subject
        if (selectedSubjectId) {
          const gradeData = await getClassGrades(selectedClassId).catch(() => []);
          const grades = Array.isArray(gradeData) ? gradeData : gradeData?.grades || [];
          const gradeMap = {};
          grades.forEach((g) => {
            if (String(g.subjectId) === String(selectedSubjectId)) {
              gradeMap[g.studentId] = { id: g.id, score: Number(g.score), comment: g.comment };
            }
          });
          setExistingGrades(gradeMap);

          // Pre-fill scores from existing grades
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
  }, [selectedClassId, selectedSubjectId]);

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
    if (!selectedSubjectId || !selectedClassId) {
      setError("Please select a class and subject");
      return;
    }
    if (Object.keys(scores).length === 0) {
      setError("Please enter at least one score");
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
            Grade Entry
          </h1>
          <p className="text-white/70 text-sm">
            Record marks for your students — select a class and subject to begin
          </p>
        </div>
      </div>

      {/* ── Selectors ── */}
      <div className="gr-fade grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ animationDelay: "0.06s" }}>
        {/* Class selector */}
        <div className="relative">
          <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <select
            value={selectedClassId}
            onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(""); }}
            className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
          >
            <option value="">Select a class...</option>
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
            <option value="">Select a subject...</option>
            {availableSubjects.map((s) => (
              <option key={s.id || s.subjectId} value={s.id || s.subjectId}>
                {s.name || s.subjectName}
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
            placeholder="Search students..."
            disabled={!selectedClassId}
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* ── Stats bar ── */}
      {selectedClassId && selectedSubjectId && students.length > 0 && (
        <div className="gr-fade grid grid-cols-3 gap-3" style={{ animationDelay: "0.1s" }}>
          {[
            { icon: Users, value: students.length, label: "Students", color: "#3B82F6" },
            { icon: Bookmark, value: availableSubjects.length, label: "Subjects", color: "#8B5CF6" },
            { icon: CheckCircle2, value: Object.keys(scores).length, label: "Grades entered", color: "#1D9E75" },
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

      {/* ── Student grade grid ── */}
      {selectedClassId && selectedSubjectId && (
        <div className="gr-fade" style={{ animationDelay: "0.14s" }}>
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
            {/* Column headers */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-3 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-700">
              <div className="w-8" />
              <div className="flex-1 text-[11px] font-semibold tracking-wider uppercase text-surface-400">
                Student
              </div>
              <div className="w-24 text-center text-[11px] font-semibold tracking-wider uppercase text-surface-400">
                Score /20
              </div>
              <div className="w-16 text-center text-[11px] font-semibold tracking-wider uppercase text-surface-400">
                Status
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={32} className="text-surface-200 dark:text-surface-600 mb-3" />
                <p className="text-sm font-medium text-surface-400">
                  {search ? "No students match your search" : "No students enrolled in this class"}
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
                          {existing ? "Update grade" : "New grade"}
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
                  Grades saved successfully!
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
                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save All Grades
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state (no class selected) ── */}
      {!selectedClassId && !loading && (
        <div className="gr-fade flex flex-col items-center justify-center py-16 text-center" style={{ animationDelay: "0.12s" }}>
          <div className="w-20 h-20 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-5 border-2 border-dashed border-surface-200 dark:border-surface-600">
            <BookOpen size={32} className="text-surface-300 dark:text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
            Select a class and subject
          </h3>
          <p className="text-sm text-surface-400 max-w-sm">
            Choose a class and subject from the dropdowns above to start entering grades.
          </p>
        </div>
      )}
    </div>
  );
}
