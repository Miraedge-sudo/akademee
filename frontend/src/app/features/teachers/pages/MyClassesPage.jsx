/**
 * MyClassesPage — Teacher's class management hub.
 *
 * Features:
 *  - Lists all classes assigned to the logged-in teacher
 *  - Shows student roster per class
 *  - Inline attendance grid (by day)
 *  - Quick stats per class
 *
 * Route: /dashboard/my-classes
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { getClasses } from "../../../core/api/classService";
import { getAllClassTeacherAssignments } from "../../../core/api/subjectService";
import { getTeacherSubjects } from "../../../core/api/subjectService";
import { getEnrollments } from "../../../core/api/enrollmentService";
import AttendanceGridModal from "../components/AttendanceGridModal";

// ── Icons ──
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Calendar,
  ChevronRight,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  GraduationCap,
} from "lucide-react";

// ── Helpers ──
function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusIcon(status) {
  switch (status) {
    case "present":
      return <CheckCircle2 size={14} className="text-teal-600" />;
    case "absent":
      return <XCircle size={14} className="text-red-500" />;
    case "late":
      return <Clock size={14} className="text-amber-500" />;
    case "excused":
      return <AlertCircle size={14} className="text-blue-500" />;
    default:
      return <Clock size={14} className="text-surface-300" />;
  }
}

const STATUS_LABELS = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

const STATUS_COLORS = {
  present: { bg: "bg-teal-100 dark:bg-teal-900/20", text: "text-teal-700 dark:text-teal-400" },
  absent: { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
  late: { bg: "bg-amber-100 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
  excused: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
};

// ── Class Card ──
function ClassCard({ cls, subjects, onViewStudents, onTakeAttendance, pc }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
      >
        {/* Class avatar */}
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${pc}15` }}
        >
          <BookOpen size={20} style={{ color: pc }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 truncate">
            {cls.name}
          </h3>
          <p className="text-[12px] text-surface-400 mt-0.5">
            {subjects.length > 0
              ? subjects.map((s) => s.name || s.subjectName).join(", ")
              : "No subjects assigned"}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <div className="text-[16px] font-extrabold text-surface-800 dark:text-surface-100">
              {cls.studentCount || 0}
            </div>
            <div className="text-[10px] text-surface-400 font-medium">Students</div>
          </div>
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0 text-surface-300 transition-transform duration-200"
             style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
          <ChevronRight size={18} />
        </div>
      </button>

      {/* Expanded content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-surface-100 dark:border-surface-700 px-5 py-4 space-y-3">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onViewStudents(cls)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-surface-50 dark:bg-surface-900 text-surface-600 dark:text-surface-300 text-[12px] font-semibold hover:bg-surface-100 dark:hover:bg-surface-700 transition-all hover:-translate-y-0.5"
            >
              <Users size={13} />
              View Students
            </button>
            <button
              onClick={() => onTakeAttendance(cls)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-white text-[12px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: pc }}
            >
              <ClipboardCheck size={13} />
              Take Attendance
            </button>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-2.5 rounded-lg bg-surface-50 dark:bg-surface-900/50">
              <div className="text-[14px] font-extrabold text-surface-800 dark:text-surface-100">
                {cls.studentCount || 0}
              </div>
              <div className="text-[10px] text-surface-400">Enrolled</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-surface-50 dark:bg-surface-900/50">
              <div className="text-[14px] font-extrabold text-surface-800 dark:text-surface-100">
                {subjects.length}
              </div>
              <div className="text-[10px] text-surface-400">Subjects</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-surface-50 dark:bg-surface-900/50">
              <div className="text-[14px] font-extrabold text-teal-600">
                —
              </div>
              <div className="text-[10px] text-surface-400">Avg. Grade</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student Row ──
const AVATAR_COLORS = [
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#EFF6FF', text: '#3B82F6' },
  { bg: '#F5F3FF', text: '#8B5CF6' },
  { bg: '#FFF7ED', text: '#F59E0B' },
  { bg: '#FCE7F3', text: '#EC4899' },
  { bg: '#ECFDF5', text: '#14B8A6' },
];

function getAvatarColors(name = '') {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function StudentRow({ student, attendance }) {
  const status = attendance?.[student.id] || null;
  const name = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
  const avColors = getAvatarColors(name);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors group">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
        style={{ background: avColors.bg, color: avColors.text }}
      >
        {initials(name)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate">
          {name}
        </div>
        <div className="text-[11px] text-surface-400">
          {student.studentNumber || student.className || ""}
        </div>
      </div>

      {/* Status badges */}
      {status && (
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            STATUS_COLORS[status]?.bg || ""
          } ${STATUS_COLORS[status]?.text || ""}`}
        >
          {getStatusIcon(status)}
          <span className="ml-1">{STATUS_LABELS[status]}</span>
        </span>
      )}
    </div>
  );
}

// ── Main Page ──
export default function MyClassesPage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const pc = primaryColor || "#085041";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});
  const [search, setSearch] = useState("");

  // Attendance modal state
  const [attendanceModal, setAttendanceModal] = useState({
    open: false,
    cls: null,
  });

  // Student list modal state
  const [studentModal, setStudentModal] = useState({
    open: false,
    cls: null,
    students: [],
    loadingStudents: false,
  });

  // ── Load teacher's classes ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const teacherId = user?.id;

      const [classData, assignmentData, subjectData] = await Promise.all([
        getClasses().catch(() => ({ classes: [] })),
        teacherId
          ? getAllClassTeacherAssignments().catch(() => [])
          : Promise.resolve([]),
        teacherId
          ? getTeacherSubjects(teacherId).catch(() => [])
          : Promise.resolve([]),
      ]);

      const allClasses = classData?.classes || classData || [];
      const allAssignments = Array.isArray(assignmentData)
        ? assignmentData
        : assignmentData?.data || [];
      const teacherSubjects = Array.isArray(subjectData)
        ? subjectData
        : subjectData?.data || [];

      // Filter classes assigned to this teacher
      const teacherClassIds = new Set(
        allAssignments
          .filter((a) => String(a.teacherId) === String(teacherId))
          .map((a) => a.classId)
      );
      const myClasses = allClasses.filter((c) => teacherClassIds.has(c.id));

          // Build subjects map: classId -> subjects[]
      const subjectsByClass = {};
      teacherSubjects.forEach((s) => {
        const cid = s.classId;
        if (!subjectsByClass[cid]) subjectsByClass[cid] = [];
        subjectsByClass[cid].push(s);
      });

      setClasses(myClasses);
      setSubjectsMap(subjectsByClass);
    } catch (err) {
      console.error("Failed to load classes:", err);
      setError(err.message || "Failed to load classes");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── View students (via enrollments) ──
  const handleViewStudents = async (cls) => {
    setStudentModal({ open: true, cls, students: [], loadingStudents: true });
    try {
      const data = await getEnrollments({
        classId: cls.id,
        status: "active",
        limit: 200,
      });
      const enrollments = data?.enrollments || [];
      const students = enrollments.map((e) => ({
        id: e.studentId,
        fullName: e.studentName,
        classId: e.classId,
        className: e.className,
      }));
      setStudentModal((prev) => ({ ...prev, students, loadingStudents: false }));
    } catch (err) {
      console.error("Failed to load students:", err);
      setStudentModal((prev) => ({ ...prev, loadingStudents: false }));
    }
  };

  // ── Take attendance ──
  const handleTakeAttendance = (cls) => {
    setAttendanceModal({ open: true, cls });
  };

  const filteredClasses = classes.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-48 bg-surface-100 dark:bg-surface-700 rounded" />
          <div className="h-4 w-64 bg-surface-100 dark:bg-surface-700 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 animate-pulse p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-surface-100 dark:bg-surface-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-surface-100 dark:bg-surface-700 rounded" />
                  <div className="h-3 w-24 bg-surface-100 dark:bg-surface-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
          Error loading classes
        </h3>
        <p className="text-sm text-surface-400 max-w-md mb-5">{error}</p>
        <button
          onClick={loadData}
          className="h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Animations ── */}
      <style>{`
        @keyframes myClFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes myClScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes myClShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .mycl-fade { animation: myClFadeUp 0.55s cubic-bezier(.16,1,.3,1) both; }
        .mycl-scale { animation: myClScaleIn 0.45s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="mycl-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${pc}, ${pc}dd)`,
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
                My Classes
              </h1>
              <p className="text-white/70 text-sm max-w-lg">
                {classes.length > 0
                  ? `You are assigned to ${classes.length} class${
                      classes.length > 1 ? "es" : ""
                    } — ${classes.reduce(
                      (s, c) => s + (c.studentCount || 0),
                      0
                    )} total students`
                  : "No classes assigned yet"}
              </p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all hover:scale-105"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      {classes.length > 0 && (
        <div className="mycl-fade relative max-w-md" style={{ animationDelay: "0.06s" }}>
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes..."
            className="w-full h-10 pl-9 pr-4 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
      )}

      {/* ── Stat cards ── */}
      {classes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: BookOpen,
              value: classes.length,
              label: "Assigned classes",
              color: pc,
              bg: `${pc}12`,
            },
            {
              icon: Users,
              value: classes.reduce((s, c) => s + (c.studentCount || 0), 0),
              label: "Total students",
              color: "#3B82F6",
              bg: "rgba(59,130,246,.08)",
            },
            {
              icon: GraduationCap,
              value: classes.reduce(
                (s, c) => s + (subjectsMap[c.id]?.length || 0),
                0
              ),
              label: "Subjects taught",
              color: "#8B5CF6",
              bg: "rgba(139,92,246,.08)",
            },
            {
              icon: Calendar,
              value: new Date().toLocaleDateString("en", { weekday: "short" }),
              label: "Today",
              color: "#F59E0B",
              bg: "rgba(245,158,11,.08)",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="mycl-scale bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4 shadow-sm"
              style={{ animationDelay: `${0.08 + idx * 0.04}s` }}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-2.5"
                style={{ background: stat.bg }}
              >
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div
                className="text-[20px] font-extrabold leading-none mb-0.5"
                style={{ color: "#1A1F1B" }}
              >
                {stat.value}
              </div>
              <div className="text-[11px] text-surface-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && classes.length === 0 && (
        <div className="mycl-fade flex flex-col items-center justify-center py-16 text-center" style={{ animationDelay: "0.1s" }}>
          <div className="w-20 h-20 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-5 border-2 border-dashed border-surface-200 dark:border-surface-600">
            <BookOpen size={32} className="text-surface-300 dark:text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
            No classes assigned
          </h3>
          <p className="text-sm text-surface-400 max-w-sm">
            You haven't been assigned to any classes yet. Contact your school
            administrator to get assigned.
          </p>
        </div>
      )}

      {/* ── Class cards grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredClasses.map((cls, idx) => (
          <div
            key={cls.id}
            className="mycl-fade"
            style={{ animationDelay: `${0.12 + idx * 0.05}s` }}
          >
            <ClassCard
              cls={cls}
              subjects={subjectsMap[cls.id] || []}
              onViewStudents={handleViewStudents}
              onTakeAttendance={handleTakeAttendance}
              pc={pc}
            />
          </div>
        ))}
      </div>

      {/* ── Attendance Modal ── */}
      {attendanceModal.open && (
        <AttendanceGridModal
          cls={attendanceModal.cls}
          pc={pc}
          onClose={() => setAttendanceModal({ open: false, cls: null })}
        />
      )}

      {/* ── Student List Modal ── */}
      {studentModal.open && (
        <StudentListModal
          cls={studentModal.cls}
          students={studentModal.students}
          loading={studentModal.loadingStudents}
          pc={pc}
          onClose={() =>
            setStudentModal({
              open: false,
              cls: null,
              students: [],
              loadingStudents: false,
            })
          }
          onTakeAttendance={() => {
            const cls = studentModal.cls;
            setStudentModal({
              open: false,
              cls: null,
              students: [],
              loadingStudents: false,
            });
            setAttendanceModal({ open: true, cls });
          }}
        />
      )}
    </div>
  );
}

// ── Student List Modal ──
function StudentListModal({
  cls,
  students,
  loading,
  pc,
  onClose,
  onTakeAttendance,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = students.filter((s) => {
    const name = (s.fullName || `${s.firstName || ""} ${s.lastName || ""}`).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-100 dark:border-surface-700 w-full max-w-lg max-h-[80vh] flex flex-col animate-[fadeUp_.35s_cubic-bezier(.16,1,.3,1)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700">
          <div>
            <h2 className="text-[16px] font-bold text-surface-900 dark:text-surface-100">
              {cls?.name}
            </h2>
            <p className="text-[12px] text-surface-400 mt-0.5">
              {students.length} student{students.length !== 1 ? "s" : ""} enrolled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onTakeAttendance}
              className="h-8 px-3 rounded-lg text-white text-[11px] font-semibold transition-all hover:scale-105"
              style={{ background: pc }}
            >
              <ClipboardCheck size={13} className="inline mr-1" />
              Attendance
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students..."
              className="w-full h-9 pl-9 pr-3 bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 rounded-lg text-[13px] text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-surface-50 dark:bg-surface-900 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users size={24} className="text-surface-300 mb-2" />
              <p className="text-sm text-surface-400">
                {searchTerm
                  ? "No students match your search"
                  : "No students in this class"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {filtered.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  attendance={{}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
