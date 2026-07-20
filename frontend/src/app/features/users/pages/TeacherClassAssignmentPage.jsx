import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../core/hooks/useTheme";
import { getClasses } from "../../../core/api/classService";
import {
  getAvailableTeachers,
  getAllClassTeacherAssignments,
  assignClassTeacher,
  removeClassTeacher,
} from "../../../core/api/subjectService";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiX,
  FiUser,
  FiBookOpen,
  FiCheck,
  FiStar,
  FiChevronRight,
  FiRefreshCw,
  FiUsers,
  FiHome,
} from "react-icons/fi";

// ── Color helpers ──
function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) {
    return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha})`;
  }
  return `rgba(8, 80, 65, ${alpha})`;
}

// ── Stat chip ──
function StatChip({ icon, value, label, color }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-100 dark:border-surface-700 p-3.5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: hexToRgba(color || "#085041", 0.08) }}
        >
          {icon}
        </div>
        <span className="text-lg font-extrabold text-surface-800 dark:text-surface-100">
          {value}
        </span>
      </div>
      <div className="text-[11px] text-surface-400 font-medium">{label}</div>
    </div>
  );
}

// ── Teacher Card ──
function TeacherCard({ teacher, isSelected, isAssignedCount, onClick }) {
  const initials = (
    (teacher.firstName?.[0] || "") + (teacher.lastName?.[0] || "")
  ).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
        isSelected
          ? "bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-600 shadow-md"
          : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-sm"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-all ${
          isSelected
            ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
            : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        }`}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold text-surface-800 dark:text-surface-100 truncate">
          {teacher.firstName} {teacher.lastName}
        </div>
        <div className="text-[11px] text-surface-400 truncate">
          {teacher.email || "—"}
        </div>
      </div>
      {isAssignedCount > 0 && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-all ${
            isSelected
              ? "bg-white/80 text-primary-700"
              : "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
          }`}
        >
          {isAssignedCount}
        </span>
      )}
      <FiChevronRight
        className={`w-4 h-4 flex-shrink-0 transition-all ${
          isSelected ? "text-primary-500" : "text-surface-300"
        }`}
      />
    </button>
  );
}

// ── Class Assignment Card ──
function ClassAssignmentCard({
  cls,
  isAssigned,
  isMainTeacher,
  teacherId,
  onToggle,
  onSetMain,
  pc,
}) {
  const levelColor = "#0EA5E9";
  const enrolled = cls.studentCount || 0;
  const capacity = cls.capacity || 40;
  const pct = capacity > 0 ? Math.min(Math.round((enrolled / capacity) * 100), 100) : 0;

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-200 ${
        isAssigned
          ? "bg-primary-50/60 dark:bg-primary-900/15 border-primary-300 dark:border-primary-700 shadow-sm"
          : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-surface-200 dark:hover:border-surface-600"
      }`}
    >
      {/* Top bar with status */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Checkbox */}
          <button
            onClick={() => onToggle(cls.id)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              isAssigned
                ? "bg-primary-600 border-primary-600 scale-110"
                : "border-surface-300 dark:border-surface-500 hover:border-primary-400"
            }`}
          >
            {isAssigned && (
              <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />
            )}
          </button>

          {/* Class initial */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: hexToRgba(levelColor, 0.08),
              border: `1.5px solid ${hexToRgba(levelColor, 0.2)}`,
              color: levelColor,
            }}
          >
            {(cls.name || "A").charAt(0).toUpperCase()}
          </div>

          {/* Class info */}
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-surface-800 dark:text-surface-100 truncate">
              {cls.name}
            </div>
            <div className="text-[10px] text-surface-400 truncate">
              {enrolled}/{capacity} {enrolled <= 1 ? "élève" : "élèves"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {/* Main Teacher Star */}
          {isAssigned && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isMainTeacher) onSetMain(cls.id);
              }}
              disabled={isMainTeacher}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isMainTeacher
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500 cursor-default"
                  : "text-surface-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-400"
              }`}
              title={
                isMainTeacher
                  ? "Professeur principal"
                  : "Définir comme professeur principal"
              }
            >
              <FiStar
                className={`w-4 h-4 transition-all ${
                  isMainTeacher ? "fill-amber-500" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Capacity bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: isAssigned
                ? `linear-gradient(90deg, ${pc}, ${hexToRgba(pc, 0.5)})`
                : "#D1D5DB",
            }}
          />
        </div>
      </div>

      {/* Main teacher badge */}
      {isMainTeacher && (
        <div className="absolute -top-2 -right-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 shadow-sm">
            <FiStar className="w-2.5 h-2.5 fill-amber-500" />
            Principal
          </span>
        </div>
      )}
    </div>
  );
}

// ── Empty State ──
function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-surface-800 dark:text-surface-100 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-surface-400 text-center max-w-sm">{subtitle}</p>
    </div>
  );
}

export default function TeacherClassAssignmentPage() {
  const { t, i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";

  // ── State ──
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    mainTeachers: 0,
  });

  // ── Load data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [teachersData, classesData, assignmentsData] = await Promise.all([
        getAvailableTeachers().catch(() => []),
        getClasses().catch(() => ({ classes: [] })),
        getAllClassTeacherAssignments().catch(() => []),
      ]);

      const allTeachers = Array.isArray(teachersData)
        ? teachersData
        : teachersData?.data || teachersData?.teachers || [];
      const allClasses = Array.isArray(classesData)
        ? classesData
        : classesData?.classes || [];
      const allAssignments = Array.isArray(assignmentsData)
        ? assignmentsData
        : assignmentsData?.data || [];

      setTeachers(allTeachers);
      setClasses(allClasses);
      setAssignments(allAssignments);
      setStats({
        totalTeachers: allTeachers.length,
        totalClasses: allClasses.length,
        totalAssignments: allAssignments.length,
        mainTeachers: allAssignments.filter((a) => a.isMain).length,
      });
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error(isFr ? "Erreur de chargement" : "Error loading data");
    }
    setLoading(false);
  }, [isFr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtered teachers ──
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  // ── Selected teacher ──
  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  );

  // ── Assignment map: classId -> assignments for that class ──
  const assignmentsByClass = useMemo(() => {
    const map = {};
    assignments.forEach((a) => {
      if (!map[a.classId]) map[a.classId] = [];
      map[a.classId].push(a);
    });
    return map;
  }, [assignments]);

  // ── Classes assigned to selected teacher ──
  const teacherAssignedClassIds = useMemo(() => {
    if (!selectedTeacherId) return new Set();
    return new Set(
      assignments
        .filter((a) => a.teacherId === selectedTeacherId)
        .map((a) => a.classId)
    );
  }, [assignments, selectedTeacherId]);

  // ── Main teacher classes for selected teacher ──
  const teacherMainClassIds = useMemo(() => {
    if (!selectedTeacherId) return new Set();
    return new Set(
      assignments
        .filter((a) => a.teacherId === selectedTeacherId && a.isMain)
        .map((a) => a.classId)
    );
  }, [assignments, selectedTeacherId]);

  // ── Assignment count per teacher ──
  const teacherAssignmentCounts = useMemo(() => {
    const counts = {};
    assignments.forEach((a) => {
      counts[a.teacherId] = (counts[a.teacherId] || 0) + 1;
    });
    return counts;
  }, [assignments]);

  // ── Filtered classes ──
  const filteredClasses = useMemo(() => {
    const q = classSearch.toLowerCase().trim();
    if (!q) return classes;
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, classSearch]);

  // ── Toggle class assignment ──
  const handleToggleAssignment = async (classId) => {
    if (!selectedTeacherId) return;
    const isAssigned = teacherAssignedClassIds.has(classId);
    setSavingId(classId);

    try {
      if (isAssigned) {
        await removeClassTeacher(classId, selectedTeacherId);
        setAssignments((prev) =>
          prev.filter(
            (a) =>
              !(a.teacherId === selectedTeacherId && a.classId === classId)
          )
        );
        toast.success(
          isFr
            ? "Enseignant retiré de la classe"
            : "Teacher removed from class"
        );
      } else {
        const saved = await assignClassTeacher(classId, {
          teacherId: selectedTeacherId,
        });
        setAssignments((prev) => [...prev, saved]);
        toast.success(
          isFr
            ? "Enseignant assigné à la classe ✨"
            : "Teacher assigned to class ✨"
        );
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || (isFr ? "Erreur" : "Error");
      toast.error(msg);
      // Optimistic revert — restore previous state on error
      if (!isAssigned) {
        // Remove the optimistically added entry
        setAssignments((prev) =>
          prev.filter(
            (a) =>
              !(
                a.teacherId === selectedTeacherId &&
                a.classId === classId &&
                !a.isMain
              )
          )
        );
      } else {
        // Re-add the assignment that was optimistically removed
        setAssignments((prev) => [
          ...prev,
          { id: Date.now(), teacherId: selectedTeacherId, classId, isMain: false },
        ]);
      }
    }
    setSavingId(null);
  };

  // ── Set as main teacher ──
  const handleSetMainTeacher = async (classId) => {
    if (!selectedTeacherId) return;
    setSavingId(classId);

    const existingMain = assignments.find(
      (a) => a.classId === classId && a.isMain && a.teacherId !== selectedTeacherId
    );
    const oldMainTeacherId = existingMain?.teacherId || null;

    try {
      // Step 1: if there's an existing main, remove it
      if (oldMainTeacherId) {
        await removeClassTeacher(classId, oldMainTeacherId);
      }

      // Step 2: assign the new main teacher
      const saved = await assignClassTeacher(classId, {
        teacherId: selectedTeacherId,
        isMain: true,
      });

      // Update local state
      setAssignments((prev) => {
        const filtered = prev.filter(
          (a) => !(a.classId === classId && a.isMain)
        );
        const withoutCurrent = filtered.filter(
          (a) => !(a.teacherId === selectedTeacherId && a.classId === classId)
        );
        return [...withoutCurrent, saved];
      });

      toast.success(
        isFr
          ? `${selectedTeacher.firstName} est maintenant professeur principal ✨`
          : `${selectedTeacher.firstName} is now the main teacher ✨`
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message || (isFr ? "Erreur" : "Error");
      toast.error(msg);

      // If old main was removed but new assignment failed, try to restore old main
      if (oldMainTeacherId) {
        try {
          await assignClassTeacher(classId, {
            teacherId: oldMainTeacherId,
            isMain: true,
          });
        } catch {
          // Silent — already showing error toast
        }
      }
    }
    setSavingId(null);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-[3px] border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin"
            style={{ borderTopColor: pc }}
          />
          <span className="text-sm text-surface-400 font-medium">
            {isFr ? "Chargement..." : "Loading..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6 animate-fadeIn">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-1 h-[26px] rounded-full"
              style={{ backgroundColor: pc }}
            />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {isFr ? "Affectation des enseignants" : "Teacher Assignments"}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr
              ? `Assignez les enseignants aux classes et désignez les professeurs principaux`
              : `Assign teachers to classes and designate main teachers`}
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border-2 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-[13.5px] font-bold hover:bg-surface-50 dark:hover:bg-surface-700 transition-all"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          {isFr ? "Actualiser" : "Refresh"}
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatChip
          icon={<FiUsers className="w-3.5 h-3.5 text-blue-500" />}
          value={stats.totalTeachers}
          label={isFr ? "Enseignants" : "Teachers"}
          color="#3B82F6"
        />
        <StatChip
          icon={<FiHome className="w-3.5 h-3.5 text-emerald-500" />}
          value={stats.totalClasses}
          label={isFr ? "Classes" : "Classes"}
          color="#10B981"
        />
        <StatChip
          icon={<FiBookOpen className="w-3.5 h-3.5 text-purple-500" />}
          value={stats.totalAssignments}
          label={isFr ? "Assignations" : "Assignments"}
          color="#8B5CF6"
        />
        <StatChip
          icon={<FiStar className="w-3.5 h-3.5 text-amber-500" />}
          value={stats.mainTeachers}
          label={isFr ? "Professeurs principaux" : "Main teachers"}
          color="#F59E0B"
        />
      </div>

      {/* ── Main Content: Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* ═══════ LEFT: Teacher List ═══════ */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-280px)] lg:max-h-none">
          {/* Teacher search */}
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-600 rounded-lg px-3 h-[40px] transition-colors focus-within:border-primary-400">
              <FiSearch className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={
                  isFr
                    ? "Rechercher un enseignant..."
                    : "Search a teacher..."
                }
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="flex-1 border-none outline-none bg-transparent text-sm text-surface-800 dark:text-surface-100 placeholder:text-surface-300 font-sans"
              />
              {teacherSearch && (
                <button
                  onClick={() => setTeacherSearch("")}
                  className="text-surface-400 hover:text-surface-600 transition-colors"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Teacher list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-10">
                <FiUser className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                <p className="text-sm text-surface-400 font-medium">
                  {isFr
                    ? "Aucun enseignant trouvé"
                    : "No teachers found"}
                </p>
              </div>
            ) : (
              filteredTeachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  isSelected={selectedTeacherId === teacher.id}
                  isAssignedCount={teacherAssignmentCounts[teacher.id] || 0}
                  onClick={() => setSelectedTeacherId(teacher.id)}
                />
              ))
            )}
          </div>

          {/* Teacher count */}
          <div className="px-4 py-2.5 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <p className="text-[11px] text-surface-400 font-medium">
              {isFr
                ? `${filteredTeachers.length} enseignant${
                    filteredTeachers.length !== 1 ? "s" : ""
                  }`
                : `${filteredTeachers.length} teacher${
                    filteredTeachers.length !== 1 ? "s" : ""
                  }`}
            </p>
          </div>
        </div>

        {/* ═══════ RIGHT: Class Assignment Grid ═══════ */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
          {!selectedTeacher ? (
            /* Empty state — no teacher selected */
            <EmptyState
              icon={
                <FiUsers className="w-7 h-7 text-surface-400" />
              }
              title={
                isFr
                  ? "Sélectionnez un enseignant"
                  : "Select a teacher"
              }
              subtitle={
                isFr
                  ? "Cliquez sur un enseignant dans la liste de gauche pour gérer ses affectations aux classes."
                  : "Click on a teacher in the left panel to manage their class assignments."
              }
            />
          ) : (
            <>
              {/* Selected teacher header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700 bg-gradient-to-r from-primary-50/50 dark:from-primary-900/10 to-transparent">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white bg-primary-600 shadow-md shadow-primary-600/20"
                >
                  {(
                    (selectedTeacher.firstName?.[0] || "") +
                    (selectedTeacher.lastName?.[0] || "")
                  ).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-surface-800 dark:text-surface-100 truncate">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </div>
                  <div className="text-[11px] text-surface-400 flex items-center gap-2">
                    <span>{selectedTeacher.email || "—"}</span>
                    <span className="text-surface-300">·</span>
                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                      {teacherAssignedClassIds.size}{" "}
                      {isFr ? "classe(s)" : "class(es)"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                  {isFr ? "Enseignant" : "Teacher"}
                </span>
              </div>

              {/* Class search */}
              <div className="p-4 border-b border-surface-100 dark:border-surface-700">
                <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-600 rounded-lg px-3 h-[38px] transition-colors focus-within:border-primary-400">
                  <FiSearch className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={
                      isFr
                        ? "Rechercher une classe..."
                        : "Search a class..."
                    }
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="flex-1 border-none outline-none bg-transparent text-sm text-surface-800 dark:text-surface-100 placeholder:text-surface-300 font-sans"
                  />
                  {classSearch && (
                    <button
                      onClick={() => setClassSearch("")}
                      className="text-surface-400 hover:text-surface-600 transition-colors"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Class grid */}
              <div className="p-4 overflow-y-auto max-h-[calc(100vh-420px)]">
                {filteredClasses.length === 0 ? (
                  <div className="text-center py-10">
                    <FiHome className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                    <p className="text-sm text-surface-400 font-medium">
                      {isFr
                        ? "Aucune classe disponible"
                        : "No classes available"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredClasses.map((cls) => {
                      const isAssigned = teacherAssignedClassIds.has(cls.id);
                      const isMain = teacherMainClassIds.has(cls.id);
                      const isSaving = savingId === cls.id;

                      return (
                        <div key={cls.id} className="relative">
                          {isSaving && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-surface-800/60 rounded-xl z-10 flex items-center justify-center">
                              <div className="w-5 h-5 rounded-full border-2 border-surface-300 border-t-primary-600 animate-spin" />
                            </div>
                          )}
                          <ClassAssignmentCard
                            cls={cls}
                            isAssigned={isAssigned}
                            isMainTeacher={isMain}
                            teacherId={selectedTeacherId}
                            onToggle={handleToggleAssignment}
                            onSetMain={handleSetMainTeacher}
                            pc={pc}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer with legend */}
              <div className="px-5 py-3 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border-2 border-primary-600 bg-primary-600" />
                    <span className="text-[10px] text-surface-500 font-medium">
                      {isFr ? "Assigné" : "Assigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border-2 border-surface-300 dark:border-surface-500" />
                    <span className="text-[10px] text-surface-500 font-medium">
                      {isFr ? "Non assigné" : "Not assigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiStar className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] text-surface-500 font-medium">
                      {isFr
                        ? "Professeur principal"
                        : "Main teacher"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
