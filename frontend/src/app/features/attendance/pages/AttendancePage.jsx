/**
 * AttendancePage — Comprehensive attendance management hub.
 *
 * Features:
 *  - Role-aware: Admin sees all classes, teacher sees only their classes
 *  - Class selector + date navigation
 *  - Student grid with quick status toggles (Present / Absent / Late / Excused)
 *  - Quick-fill all with one click
 *  - Bulk save with loading & feedback
 *  - Live stats bar (P / A / L / E / Unmarked)
 *  - Weekly trend chart (last 7 days)
 *  - Monthly trend chart (last 6 months)
 *  - Class stats overview with animated bars
 *  - Student search
 *  - Full i18n support (FR/EN)
 *
 * Route: /dashboard/attendance
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { getClasses, getTeacherClasses } from "../../../core/api/classService";
import { getEnrollments } from "../../../core/api/enrollmentService";
import {
  getClassAttendanceByDate,
  recordBulkAttendance,
  getClassAttendanceStats,
  getMonthlyTrends,
} from "../../../core/api/attendanceService";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  RefreshCw,
  GraduationCap,
  BookOpen,
  TrendingUp,
  BarChart3,
  Activity,
  TrendingDown,
} from "lucide-react";

const STATUS_CONFIG = [
  {
    value: "present",
    label: "P",
    full: "present",
    icon: CheckCircle2,
    color: "#1D9E75",
  },
  {
    value: "absent",
    label: "A",
    full: "absent",
    icon: XCircle,
    color: "#EF4444",
  },
  {
    value: "late",
    label: "L",
    full: "late",
    icon: Clock,
    color: "#F59E0B",
  },
  {
    value: "excused",
    label: "E",
    full: "excused",
    icon: AlertCircle,
    color: "#3B82F6",
  },
];

function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function todayStr() {
  return formatDate(new Date());
}

function initials(name) {
  return (name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
  return `rgba(8,80,65,${alpha})`;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}

// ── Stat Chip ──
function StatChip({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border-[1.5px] border-surface-100 dark:border-surface-700 p-3.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(color, 0.1) }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span className="text-lg font-extrabold" style={{ color }}>{value}</span>
      </div>
      <div className="text-[10px] text-surface-400 font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ── Student Row ──
function StudentRow({ student, status, onSetStatus, saving }) {
  const AVATAR_COLORS = [
    { bg: "#E1F5EE", text: "#085041" },
    { bg: "#EFF6FF", text: "#3B82F6" },
    { bg: "#F5F3FF", text: "#8B5CF6" },
    { bg: "#FFF7ED", text: "#F59E0B" },
    { bg: "#FCE7F3", text: "#EC4899" },
    { bg: "#ECFDF5", text: "#14B8A6" },
  ];
  const idx = (student.fullName || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const avColor = AVATAR_COLORS[idx];
  const activeStatus = STATUS_CONFIG.find((s) => s.value === status);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200"
      style={{
        background: status ? hexToRgba(activeStatus?.color || "#9BA59C", 0.04) : "transparent",
        border: status
          ? `1.5px solid ${hexToRgba(activeStatus?.color || "#9BA59C", 0.15)}`
          : "1.5px solid transparent",
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 transition-all"
        style={{
          background: status ? hexToRgba(activeStatus?.color || "#9BA59C", 0.15) : avColor.bg,
          color: status ? activeStatus?.color : avColor.text,
        }}
      >
        {initials(student.fullName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate">{student.fullName || "—"}</div>
        <div className="text-[10px] text-surface-400 truncate">{student.studentNumber || ""}</div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {STATUS_CONFIG.map((opt) => {
          const isActive = status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSetStatus(student.id, opt.value)}
              disabled={saving}
              className={`w-8 h-8 rounded-lg text-[12px] font-extrabold transition-all duration-150 ${
                isActive
                  ? "text-white shadow-sm scale-110 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-surface-800"
                  : "text-surface-300 dark:text-surface-500 hover:text-surface-600 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ background: isActive ? opt.color : undefined }}
              title={opt.full}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Animated Bar ──
function AnimatedBar({ value, max, color, label, delay = 0, showValue = true }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      {showValue && (
        <span className="text-[11px] font-extrabold" style={{ color }}>{value}</span>
      )}
      <div className="w-full h-20 bg-surface-50 dark:bg-surface-900 rounded-lg overflow-hidden relative flex flex-col-reverse">
        <div
          className="w-full rounded-t-lg transition-all duration-1000 ease-out"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(180deg, ${color}, ${hexToRgba(color, 0.6)})`,
            animationDelay: `${delay}s`,
          }}
        />
      </div>
      <span className="text-[9px] text-surface-400 font-medium truncate w-full text-center">{label}</span>
    </div>
  );
}

// ── Weekly Trend Chart ──
function WeeklyTrendChart({ weeklyData, isFr }) {
  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BarChart3 size={24} className="text-surface-300 mb-2" />
        <p className="text-sm text-surface-400">{isFr ? "Aucune donnée cette semaine" : "No data this week"}</p>
      </div>
    );
  }

  const maxVal = Math.max(...weeklyData.map((d) => d.total || 0), 1);
  const days = weeklyData.map((d) => ({
    ...d,
    dayLabel: new Date(d.date + "T12:00:00").toLocaleDateString(isFr ? "fr-FR" : "en-US", { weekday: "short" }),
    dateLabel: new Date(d.date + "T12:00:00").toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="space-y-4">
      {/* Stacked bar chart */}
      <div className="flex items-end gap-1.5 h-32 px-2">
        {days.map((d, idx) => {
          const presentPct = maxVal > 0 ? (d.present / maxVal) * 100 : 0;
          const absentPct = maxVal > 0 ? (d.absent / maxVal) * 100 : 0;
          const latePct = maxVal > 0 ? (d.late / maxVal) * 100 : 0;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-surface-500">{d.total || 0}</span>
              <div className="w-full h-24 bg-surface-50 dark:bg-surface-900 rounded-lg overflow-hidden relative flex flex-col-reverse">
                {d.late > 0 && (
                  <div
                    className="w-full transition-all duration-700 ease-out"
                    style={{
                      height: `${latePct}%`,
                      background: "#F59E0B",
                      animationDelay: `${idx * 0.08}s`,
                    }}
                  />
                )}
                {d.absent > 0 && (
                  <div
                    className="w-full transition-all duration-700 ease-out"
                    style={{
                      height: `${absentPct}%`,
                      background: "#EF4444",
                      animationDelay: `${idx * 0.08 + 0.1}s`,
                    }}
                  />
                )}
                {d.present > 0 && (
                  <div
                    className="w-full transition-all duration-700 ease-out"
                    style={{
                      height: `${presentPct}%`,
                      background: `linear-gradient(180deg, #1D9E75, ${hexToRgba("#1D9E75", 0.6)})`,
                      animationDelay: `${idx * 0.08 + 0.2}s`,
                    }}
                  />
                )}
              </div>
              <span className="text-[9px] text-surface-400 font-medium">{d.dayLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-surface-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#1D9E75" }} />
          {isFr ? "Présent" : "Present"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#EF4444" }} />
          {isFr ? "Absent" : "Absent"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#F59E0B" }} />
          {isFr ? "Retard" : "Late"}
        </span>
      </div>
    </div>
  );
}

// ── Monthly Trend Chart ──
function MonthlyTrendChart({ monthlyData, isFr }) {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity size={24} className="text-surface-300 mb-2" />
        <p className="text-sm text-surface-400">{isFr ? "Aucune donnée mensuelle" : "No monthly data"}</p>
      </div>
    );
  }

  const maxRate = Math.max(...monthlyData.map((d) => d.rate || 0), 100);
  const targetRate = 75;

  return (
    <div className="space-y-4">
      {/* Line area chart (CSS approximation) */}
      <div className="relative h-36 px-2">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between px-2 pb-6">
          {[100, 75, 50, 25, 0].map((line) => (
            <div key={line} className="flex items-center gap-2">
              <span className="text-[8px] text-surface-300 w-6 text-right">{line}%</span>
              <div className="flex-1 border-t border-dashed border-surface-100 dark:border-surface-700" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative h-full flex items-end gap-2 pl-10 pr-2 pb-6">
          {monthlyData.map((d, idx) => {
            const barH = Math.min((d.rate / 100) * 100, 100);
            const isAboveTarget = d.rate >= targetRate;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                {/* Rate dot + line */}
                <div className="relative w-full flex flex-col items-center transition-all duration-1000" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div
                    className="w-1.5 h-1.5 rounded-full mb-0.5 transition-all duration-700"
                    style={{
                      background: isAboveTarget ? "#1D9E75" : "#EF4444",
                      boxShadow: `0 0 6px ${isAboveTarget ? "#1D9E75" : "#EF4444"}`,
                    }}
                  />
                  <div
                    className="w-full rounded-t-sm transition-all duration-700"
                    style={{
                      height: `${barH}px`,
                      maxHeight: `${barH}%`,
                      background: isAboveTarget
                        ? `linear-gradient(180deg, ${hexToRgba("#1D9E75", 0.5)}, ${hexToRgba("#1D9E75", 0.1)})`
                        : `linear-gradient(180deg, ${hexToRgba("#EF4444", 0.5)}, ${hexToRgba("#EF4444", 0.1)})`,
                      borderTop: `2px solid ${isAboveTarget ? "#1D9E75" : "#EF4444"}`,
                    }}
                  />
                </div>
                {/* Month label */}
                <span className="text-[8px] text-surface-400 font-medium mt-1">
                  {new Date(d.month + "T12:00:00").toLocaleDateString(isFr ? "fr-FR" : "en-US", { month: "short" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target line indicator */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-surface-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded" style={{ background: "#1D9E75" }} />
          {isFr ? "Taux cible (75%)" : "Target rate (75%)"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded" style={{ background: "#EF4444" }} />
          {isFr ? "Sous la cible" : "Below target"}
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingUp size={10} className="text-teal-500" />
          {isFr ? "Tendance +" : "Up trend"}
        </span>
      </div>
    </div>
  );
}

// ── Class Stats Overview ──
function ClassStatsOverview({ stats, isFr }) {
  const isLoading = !stats;
  const maxCount = stats ? Math.max(stats.present, stats.absent, stats.late, stats.excused, 1) : 1;
  const rate = stats?.attendanceRate || 0;
  const rateColor = rate >= 75 ? "#1D9E75" : rate >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="space-y-4">
      {/* Rate ring */}
      <div className="flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#EEF0EC" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={rateColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(rate / 100) * 264} 264`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold" style={{ color: rateColor }}>{rate}%</span>
            <span className="text-[8px] text-surface-400 font-medium uppercase tracking-wider">{isFr ? "Présence" : "Rate"}</span>
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2.5">
        {[
          { label: isFr ? "Présents" : "Present", value: stats?.present || 0, color: "#1D9E75" },
          { label: isFr ? "Absents" : "Absent", value: stats?.absent || 0, color: "#EF4444" },
          { label: isFr ? "Retards" : "Late", value: stats?.late || 0, color: "#F59E0B" },
          { label: isFr ? "Excusés" : "Excused", value: stats?.excused || 0, color: "#3B82F6" },
        ].map((item) => {
          const pct = maxCount > 0 ? (item.value / maxCount) * 100 : 0;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-surface-500 w-16 text-right">{item.label}</span>
              <div className="flex-1 h-4 bg-surface-50 dark:bg-surface-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${hexToRgba(item.color, 0.5)})`,
                  }}
                />
              </div>
              <span className="text-[11px] font-extrabold min-w-[24px]" style={{ color: item.color }}>{item.value}</span>
            </div>
          );
        })}
      </div>

      {stats && (
        <div className="flex items-center justify-center gap-2 text-[11px] text-surface-400 pt-1">
          <Users size={12} />
          <span>{stats.uniqueStudents || 0} {isFr ? "élève(s)" : "student(s)"}</span>
          <span className="text-surface-300">·</span>
          <span>{stats.total || 0} {isFr ? "entrée(s)" : "entry(ies)"}</span>
        </div>
      )}
    </div>
  );
}

// ── Loading Skeleton ──
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-full bg-surface-100 dark:bg-surface-700 rounded-xl" />
      <div className="grid grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-surface-100 dark:bg-surface-700 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-surface-50 dark:bg-surface-900 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Empty State ──
function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-5 border-2 border-dashed border-surface-200 dark:border-surface-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-1.5">{title}</h3>
      <p className="text-sm text-surface-400 max-w-sm">{subtitle}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AttendancePage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const { t, i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";
  const isAdmin = user?.roles?.includes("ADMIN");

  // ── Attendance State ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── Charts State ──
  const [classStats, setClassStats] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);

  // ── Load classes (role-aware) ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (isAdmin) {
          const data = await getClasses({ limit: 200 }).catch(() => ({ classes: [] }));
          setClasses(data?.classes || []);
        } else {
          const teacherId = user?.id;
          if (teacherId) {
            const list = await getTeacherClasses(teacherId).catch(() => []);
            setClasses(Array.isArray(list) ? list : []);
          }
        }
      } catch {
        setClasses([]);
      }
      setLoading(false);
    }
    load();
  }, [isAdmin, user?.id]);

  // ── Load students + existing attendance for selected class + date ──
  const loadAttendanceData = useCallback(async () => {
    if (!selectedClassId) return;
    setDataLoaded(false);
    setError(null);
    setSuccess(false);
    try {
      const [enrollData, attData] = await Promise.all([
        getEnrollments({ classId: selectedClassId, status: "active", limit: 500 }).catch(() => ({ enrollments: [] })),
        getClassAttendanceByDate(selectedClassId, date).catch(() => []),
      ]);

      const studentList = (enrollData?.enrollments || []).map((e) => ({
        id: e.studentId,
        fullName: e.studentName || "—",
        studentNumber: e.enrollmentNumber || "",
      }));

      const existing = {};
      const records = Array.isArray(attData) ? attData : attData?.records || [];
      records.forEach((r) => { existing[r.studentId] = r.status; });

      const initAtt = {};
      studentList.forEach((s) => { initAtt[s.id] = existing[s.id] || null; });

      setStudents(studentList);
      setAttendance(initAtt);
    } catch (err) {
      console.error("Failed to load attendance data:", err);
      setError(isFr ? "Échec du chargement" : "Failed to load data");
    }
    setDataLoaded(true);
  }, [selectedClassId, date]);

  useEffect(() => { loadAttendanceData(); }, [loadAttendanceData]);

  // ── Load charts data when class changes ──
  useEffect(() => {
    if (!selectedClassId) return;
    async function loadCharts() {
      setChartsLoading(true);
      try {
        const [statsData, trendsData] = await Promise.all([
          getClassAttendanceStats(selectedClassId).catch(() => null),
          getMonthlyTrends({ months: 6 }).catch(() => []),
        ]);
        setClassStats(statsData);
        setMonthlyTrends(Array.isArray(trendsData) ? trendsData : []);

        // Build weekly data from last 7 days
        const last7 = getLast7Days();
        const weekPromises = last7.map(async (day) => {
          const dayData = await getClassAttendanceByDate(selectedClassId, day).catch(() => []);
          const records = Array.isArray(dayData) ? dayData : dayData?.records || [];
          return {
            date: day,
            present: records.filter((r) => r.status === "present").length,
            absent: records.filter((r) => r.status === "absent").length,
            late: records.filter((r) => r.status === "late").length,
            excused: records.filter((r) => r.status === "excused").length,
            total: records.length,
          };
        });
        const weekData = await Promise.all(weekPromises);
        setWeeklyData(weekData);
      } catch {
        // Silent
      }
      setChartsLoading(false);
    }
    loadCharts();
  }, [selectedClassId]);

  // ── Set status for a student ──
  const setStatus = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }));
    setSuccess(false);
  };

  // ── Quick fill all ──
  const fillAll = (status) => {
    const updated = {};
    students.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
    setSuccess(false);
  };

  // ── Save ──
  const handleSave = async () => {
    const records = students
      .filter((s) => attendance[s.id])
      .map((s) => ({ studentId: s.id, status: attendance[s.id] }));

    if (records.length === 0) {
      setError(isFr ? "Marquez au moins un élève avant d'enregistrer." : "Mark at least one student before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await recordBulkAttendance({ classId: selectedClassId, date, records });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || (isFr ? "Échec de l'enregistrement" : "Failed to save"));
    }
    setSaving(false);
  };

  // ── Date navigation ──
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

  // ── Live stats ──
  const stats = useMemo(() => ({
    present: Object.values(attendance).filter((s) => s === "present").length,
    absent: Object.values(attendance).filter((s) => s === "absent").length,
    late: Object.values(attendance).filter((s) => s === "late").length,
    excused: Object.values(attendance).filter((s) => s === "excused").length,
    unmarked: Object.values(attendance).filter((s) => !s).length,
  }), [attendance]);

  const filteredStudents = useMemo(() =>
    students.filter((s) => s.fullName?.toLowerCase().includes(search.toLowerCase())),
    [students, search]
  );

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const canSave = selectedClassId && dataLoaded && students.length > 0;

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <style>{`
        @keyframes attFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes attScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes barGrow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        .att-fade { animation: attFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
        .att-scale { animation: attScaleIn 0.4s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ═══════ HEADER ═══════ */}
      <div
        className="att-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
              {isFr ? "Gestion des présences" : "Attendance"}
            </h1>
            <p className="text-white/70 text-sm max-w-lg">
              {isFr
                ? "Enregistrez et suivez la présence des élèves par classe et par jour."
                : "Record and track student attendance by class and day."}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <CalendarDays size={16} className="text-white/80" />
            <span className="text-sm font-semibold text-white">
              {new Date(date).toLocaleDateString(isFr ? "fr-FR" : "en-US", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════ SELECTORS ROW ═══════ */}
      <div className="att-fade grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ animationDelay: "0.06s" }}>
        <div className="relative">
          <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <select
            value={selectedClassId}
            onChange={(e) => { setSelectedClassId(e.target.value); setSearch(""); }}
            className="w-full h-11 pl-10 pr-9 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 appearance-none cursor-pointer focus:outline-none focus:border-primary-400 transition-colors"
          >
            <option value="">{isFr ? "Sélectionner une classe..." : "Select a class..."}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.studentCount > 0 ? `(${c.studentCount})` : ""}</option>
            ))}
          </select>
          <ChevronRight size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none rotate-90" />
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl px-3 h-11">
          <button onClick={prevDay} className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-900 flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
              {new Date(date).toLocaleDateString(isFr ? "fr-FR" : "en-US", { month: "short", day: "numeric" })}
            </div>
            <div className="text-[10px] text-surface-400">
              {new Date(date).toLocaleDateString(isFr ? "fr-FR" : "en-US", { weekday: "short" })}
            </div>
          </div>
          <button onClick={nextDay} className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-900 flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex-shrink-0">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setDate(todayStr())} className="hidden sm:flex h-8 px-2.5 rounded-lg bg-surface-50 dark:bg-surface-900 items-center justify-center text-[10px] font-bold text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex-shrink-0 uppercase tracking-wider">
            {isFr ? "Ajd" : "Today"}
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isFr ? "Rechercher un élève..." : "Search a student..."}
            disabled={!selectedClassId}
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-sm text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      {loading ? (
        <LoadingSkeleton />
      ) : !selectedClassId ? (
        <EmptyState
          icon={<BookOpen size={32} className="text-surface-300" />}
          title={isFr ? "Sélectionnez une classe" : "Select a class"}
          subtitle={isFr ? "Choisissez une classe et une date pour commencer l'appel." : "Choose a class and date to start taking attendance."}
        />
      ) : !dataLoaded ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full border-[3px] border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" style={{ borderTopColor: pc }} />
        </div>
      ) : (
        <div className="space-y-5">
          {/* ── Quick fill bar ── */}
          <div className="att-fade flex items-center flex-wrap gap-2" style={{ animationDelay: "0.08s" }}>
            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider mr-1">
              {isFr ? "Remplir :" : "Fill all:"}
            </span>
            {STATUS_CONFIG.map((opt) => (
              <button
                key={opt.value}
                onClick={() => fillAll(opt.value)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-white text-[11px] font-bold transition-all hover:scale-105 hover:shadow-md active:scale-95"
                style={{ background: opt.color }}
                title={`${isFr ? "Marquer tous" : "Mark all as"} ${opt.full}`}
              >
                <opt.icon size={13} />
                {isFr
                  ? { present: "Présents", absent: "Absents", late: "Retards", excused: "Excusés" }[opt.value]
                  : opt.full.charAt(0).toUpperCase() + opt.full.slice(1)}
              </button>
            ))}
            <button
              onClick={() => {
                const reset = {};
                students.forEach((s) => { reset[s.id] = null; });
                setAttendance(reset);
              }}
              className="h-8 px-3 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-500 dark:text-surface-400 text-[11px] font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-all"
            >
              {isFr ? "Réinitialiser" : "Reset"}
            </button>
          </div>

          {/* ── Live Stats Grid ── */}
          <div className="att-fade grid grid-cols-5 gap-2.5" style={{ animationDelay: "0.1s" }}>
            <StatChip label={isFr ? "Présents" : "Present"} value={stats.present} color="#1D9E75" icon={CheckCircle2} />
            <StatChip label={isFr ? "Absents" : "Absent"} value={stats.absent} color="#EF4444" icon={XCircle} />
            <StatChip label={isFr ? "Retards" : "Late"} value={stats.late} color="#F59E0B" icon={Clock} />
            <StatChip label={isFr ? "Excusés" : "Excused"} value={stats.excused} color="#3B82F6" icon={AlertCircle} />
            <StatChip label={isFr ? "Non marqués" : "Unmarked"} value={stats.unmarked} color="#9BA59C" icon={Users} />
          </div>

          {/* ═══════ CHARTS SECTION ═══════ */}
          <div className="att-fade grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ animationDelay: "0.11s" }}>
            {/* Monthly Trend */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-100 dark:border-surface-700">
                <Activity size={15} className="text-purple-500" />
                <h3 className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                  {isFr ? "Tendance mensuelle" : "Monthly Trend"}
                </h3>
                {chartsLoading && <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-300 border-t-purple-500 animate-spin ml-auto" />}
              </div>
              <div className="p-4">
                {chartsLoading && !monthlyTrends.length ? (
                  <div className="h-36 bg-surface-50 dark:bg-surface-900 rounded-xl animate-pulse" />
                ) : (
                  <MonthlyTrendChart monthlyData={monthlyTrends} isFr={isFr} />
                )}
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-100 dark:border-surface-700">
                <BarChart3 size={15} className="text-blue-500" />
                <h3 className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                  {isFr ? "Tendance hebdomadaire" : "Weekly Trend"}
                </h3>
                {chartsLoading && <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-300 border-t-blue-500 animate-spin ml-auto" />}
              </div>
              <div className="p-4">
                {chartsLoading && !weeklyData.length ? (
                  <div className="h-36 bg-surface-50 dark:bg-surface-900 rounded-xl animate-pulse" />
                ) : (
                  <WeeklyTrendChart weeklyData={weeklyData} isFr={isFr} />
                )}
              </div>
            </div>

            {/* Class Stats Overview */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-100 dark:border-surface-700">
                <TrendingUp size={15} className="text-emerald-500" />
                <h3 className="text-[13px] font-bold text-surface-800 dark:text-surface-100">
                  {isFr ? "Aperçu des statistiques" : "Stats Overview"}
                </h3>
                {chartsLoading && <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-300 border-t-emerald-500 animate-spin ml-auto" />}
              </div>
              <div className="p-4">
                {chartsLoading && !classStats ? (
                  <div className="h-36 bg-surface-50 dark:bg-surface-900 rounded-xl animate-pulse" />
                ) : (
                  <ClassStatsOverview stats={classStats} isFr={isFr} />
                )}
              </div>
            </div>
          </div>

          {/* ── Student list ── */}
          <div className="att-fade bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 shadow-sm overflow-hidden" style={{ animationDelay: "0.12s" }}>
            <div className="hidden sm:flex items-center gap-3 px-4 py-3 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-700">
              <div className="w-9" />
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
                {isFr ? "Élève" : "Student"}
              </div>
              <div className="flex gap-1">
                {STATUS_CONFIG.map((opt) => (
                  <div key={opt.value} className="w-8 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: opt.color }}>
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={28} className="text-surface-200 dark:text-surface-600 mb-2" />
                <p className="text-sm font-medium text-surface-400">
                  {search
                    ? (isFr ? "Aucun élève ne correspond" : "No students match")
                    : (isFr ? "Aucun élève dans cette classe" : "No students in this class")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-50 dark:divide-surface-700/50 px-2 py-2 space-y-1">
                {filteredStudents.map((student, idx) => (
                  <div key={student.id} className="att-fade" style={{ animationDelay: `${0.14 + idx * 0.025}s` }}>
                    <StudentRow
                      student={student}
                      status={attendance[student.id]}
                      onSetStatus={setStatus}
                      saving={saving}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer actions ── */}
          <div className="att-fade flex items-center justify-between flex-wrap gap-3" style={{ animationDelay: "0.16s" }}>
            <div className="flex items-center gap-2">
              {selectedClass && (
                <div className="flex items-center gap-2 text-[12px] text-surface-400">
                  <GraduationCap size={14} />
                  <span className="font-medium text-surface-500 dark:text-surface-300">{selectedClass.name}</span>
                  <span className="text-surface-300">·</span>
                  <span>{students.length} {isFr ? "élève(s)" : "student(s)"}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {error && (
                <span className="text-[12px] font-medium text-red-500 flex items-center gap-1">
                  <XCircle size={13} />{error}
                </span>
              )}
              {success && (
                <span className="text-[12px] font-medium text-teal-600 flex items-center gap-1">
                  <CheckCircle2 size={13} />{isFr ? "Appel enregistré !" : "Attendance saved!"}
                </span>
              )}

              <button onClick={loadAttendanceData} disabled={saving}
                className="h-9 px-3.5 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-500 dark:text-surface-400 text-[12px] font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-all flex items-center gap-1.5 disabled:opacity-40">
                <RefreshCw size={13} />{isFr ? "Actualiser" : "Refresh"}
              </button>

              <button onClick={handleSave} disabled={saving || !canSave}
                className="h-9 px-4 rounded-lg text-white text-[12px] font-semibold transition-all hover:scale-105 hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5"
                style={{ background: pc }}>
                {saving ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isFr ? "Enregistrement..." : "Saving..."}</>
                ) : (
                  <><Save size={14} />{isFr ? "Enregistrer l'appel" : "Save Attendance"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
