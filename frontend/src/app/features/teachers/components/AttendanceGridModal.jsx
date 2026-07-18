/**
 * AttendanceGridModal — Full-featured attendance grid for a class on a specific date.
 *
 * Features:
 *  - Date picker (defaults to today)
 *  - Fetches existing attendance for the selected date
 *  - Grid of students with 4 status options: Present, Absent, Late, Excused
 *  - Visual color-coded status indicators
 *  - Bulk save with loading state
 *  - Summary counts (present/absent/late/excused)
 */
import { useState, useEffect, useCallback } from "react";
import { getEnrollments } from "../../../core/api/enrollmentService";
import {
  getClassAttendanceByDate,
  recordBulkAttendance,
} from "../../../core/api/attendanceService";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Users,
  CalendarDays,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "present", label: "P", full: "Present", icon: CheckCircle2, color: "#1D9E75", bg: "bg-teal-500" },
  { value: "absent", label: "A", full: "Absent", icon: XCircle, color: "#EF4444", bg: "bg-red-500" },
  { value: "late", label: "L", full: "Late", icon: Clock, color: "#F59E0B", bg: "bg-amber-500" },
  { value: "excused", label: "E", full: "Excused", icon: AlertCircle, color: "#3B82F6", bg: "bg-blue-500" },
];

function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function todayStr() {
  return formatDate(new Date());
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AttendanceGridModal({ cls, pc = "#085041", onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ── Load students + existing attendance ──
  const loadData = useCallback(async () => {
    if (!cls?.id) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const [enrollData, attData] = await Promise.all([
        getEnrollments({ classId: cls.id, status: "active", limit: 500 }),
        getClassAttendanceByDate(cls.id, date).catch(() => []),
      ]);

      const className = cls.name || "";
      const studentList = (enrollData?.enrollments || []).map((e) => ({
        id: e.studentId,
        fullName: e.studentName || "Unknown",
        className: e.className || className,
      }));

      const existing = {};
      const records = Array.isArray(attData) ? attData : [];
      records.forEach((r) => {
        existing[r.studentId] = r.status;
      });

      // Initialize attendance with existing records or default to null
      const initAtt = {};
      studentList.forEach((s) => {
        initAtt[s.id] = existing[s.id] || null;
      });

      setStudents(studentList);
      setAttendance(initAtt);
    } catch (err) {
      console.error("Failed to load attendance data:", err);
      setError("Failed to load class data");
    }
    setLoading(false);
  }, [cls?.id, cls?.name, date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Set status for a student ──
  const setStatus = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    setSuccess(false);
  };

  // ── Quick fill all ──
  const fillAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendance(updated);
    setSuccess(false);
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const records = students
        .filter((s) => attendance[s.id]) // Only submit students with a status
        .map((s) => ({
          studentId: s.id,
          status: attendance[s.id],
        }));

      if (records.length === 0) {
        setError("Please mark at least one student before saving.");
        setSaving(false);
        return;
      }

      await recordBulkAttendance({
        classId: cls.id,
        date,
        records,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      setError(err.response?.data?.message || err.message || "Failed to save attendance");
    }
    setSaving(false);
  };

  // ── Navigate date ──
  const prevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(formatDate(d));
  };

  const nextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(formatDate(d));
  };

  // ── Stats ──
  const stats = {
    present: Object.values(attendance).filter((s) => s === "present").length,
    absent: Object.values(attendance).filter((s) => s === "absent").length,
    late: Object.values(attendance).filter((s) => s === "late").length,
    excused: Object.values(attendance).filter((s) => s === "excused").length,
    unmarked: Object.values(attendance).filter((s) => !s).length,
  };

  const filteredStudents = students.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-100 dark:border-surface-700 w-full max-w-3xl max-h-[90vh] flex flex-col animate-[fadeUp_.35s_cubic-bezier(.16,1,.3,1)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Animations ── */}
        <style>{`
          @keyframes attFadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes attPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .att-item { animation: attFadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
        `}</style>

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between p-4 sm:p-5 rounded-t-2xl"
          style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white">
                Attendance — {cls?.name}
              </h2>
              <p className="text-white/70 text-[12px] mt-0.5">
                {students.length} students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Date navigator + Quick fill ── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/30">
          {/* Date */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevDay}
              className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="text-center min-w-[140px]">
              <div className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                {new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="text-[10px] text-surface-400">
                {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
              </div>
            </div>
            <button
              onClick={nextDay}
              className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick fill */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-surface-400 mr-1">
              Fill all:
            </span>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => fillAll(opt.value)}
                className="w-7 h-7 rounded-md text-white text-[11px] font-bold transition-all hover:scale-110 hover:shadow-md"
                style={{ background: opt.color }}
                title={`Mark all as ${opt.full}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search (mobile friendly) */}
          <div className="relative sm:hidden">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-24 h-7 pl-7 pr-2 bg-surface-100 dark:bg-surface-700 rounded-md text-[11px] text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none"
            />
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-5 gap-2 px-4 sm:px-5 py-3 border-b border-surface-100 dark:border-surface-700 bg-surface-50/30 dark:bg-surface-900/10">
          {[
            { label: "Present", value: stats.present, color: "#1D9E75" },
            { label: "Absent", value: stats.absent, color: "#EF4444" },
            { label: "Late", value: stats.late, color: "#F59E0B" },
            { label: "Excused", value: stats.excused, color: "#3B82F6" },
            { label: "Unmarked", value: stats.unmarked, color: "#9BA59C" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[16px] font-extrabold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[9px] text-surface-400 font-medium truncate">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Search (desktop) ── */}
        <div className="hidden sm:block px-4 sm:px-5 pt-3 pb-1">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full h-9 pl-9 pr-3 bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 rounded-lg text-[13px] text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>
        </div>

        {/* ── Student grid ── */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-surface-50 dark:bg-surface-900 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users size={32} className="text-surface-200 dark:text-surface-600 mb-3" />
              <p className="text-sm font-medium text-surface-400">
                {search ? "No students match your search" : "No students enrolled"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredStudents.map((student, idx) => (
                <div
                  key={student.id}
                  className="att-item flex items-center gap-3 p-3 rounded-xl border-[1.5px] transition-all duration-200"
                  style={{
                    animationDelay: `${idx * 0.03}s`,
                    borderColor: attendance[student.id]
                      ? STATUS_OPTIONS.find((o) => o.value === attendance[student.id])?.color + "30"
                      : "var(--surface-100)",
                    background: attendance[student.id]
                      ? STATUS_OPTIONS.find((o) => o.value === attendance[student.id])?.color + "08"
                      : "",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                    style={{
                      background: attendance[student.id]
                        ? STATUS_OPTIONS.find((o) => o.value === attendance[student.id])?.color + "20"
                        : "#E1F5EE",
                      color: attendance[student.id]
                        ? STATUS_OPTIONS.find((o) => o.value === attendance[student.id])?.color
                        : "#085041",
                    }}
                  >
                    {initials(student.fullName)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-surface-900 dark:text-surface-100 truncate">
                      {student.fullName}
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = attendance[student.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(student.id, opt.value)}
                          className={`w-7 h-7 rounded-md text-[11px] font-bold transition-all duration-150 ${
                            isActive
                              ? "text-white shadow-sm scale-110"
                              : "text-surface-300 dark:text-surface-500 hover:text-surface-500 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-700"
                          }`}
                          style={{
                            background: isActive ? opt.color : undefined,
                          }}
                          title={opt.full}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-t border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/30 rounded-b-2xl">
          <div className="flex items-center gap-2">
            {/* Error / Success feedback */}
            {error && (
              <span className="text-[11px] font-medium text-red-500 flex items-center gap-1 animate-[attPulse_2s_ease-in-out_infinite]">
                <AlertCircle size={12} />
                {error}
              </span>
            )}
            {success && (
              <span className="text-[11px] font-medium text-teal-600 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Attendance saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="h-9 px-3.5 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-[12px] font-semibold hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 rounded-lg text-white text-[12px] font-semibold transition-all hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5"
              style={{ background: pc }}
            >
              {saving ? (
                <>
                  <div
                    className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
