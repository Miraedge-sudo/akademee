/**
 * AttendanceMiniCalendar — simple grid showing present/absent/late days for the month.
 * Fetches real attendance data from the API.
 */
import { useEffect, useState, useMemo } from 'react';
import { getAttendanceStats } from '../../../core/api/attendanceService';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const STATUS_COLORS = {
  present: { bg: '#E1F5EE', text: '#085041' },
  absent:  { bg: 'rgba(239,68,68,.12)', text: '#EF4444' },
  late:    { bg: 'rgba(245,158,11,.12)', text: '#F59E0B' },
  empty:   { bg: '#F7F8F6', text: '#BFC4BB' },
};

export default function AttendanceMiniCalendar({ studentId, attendanceStats }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attendanceStats) {
      setStats(attendanceStats);
      setLoading(false);
    } else if (studentId) {
      setLoading(true);
      getAttendanceStats({ studentId })
        .then(data => setStats(data))
        .catch(() => setStats(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [studentId, attendanceStats]);

  // Build a visual representation of the month's attendance
  const monthDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

    const days = [];
    // Empty cells before first day
    for (let i = 0; i < (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1); i++) {
      days.push({ day: null, status: 'empty' });
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, status: 'empty' });
    }

    return days;
  }, []);

  const totalRecords = stats ? (stats.present + stats.absent + stats.late + stats.excused) : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
        <div className="h-5 w-40 bg-surface-100 dark:bg-surface-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-7 gap-[3px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface-50 dark:bg-surface-900 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Attendance — {new Date().toLocaleDateString('en', { month: 'short', year: 'numeric' })}
        </div>
        {totalRecords > 0 && (
          <span className="text-[11px] text-surface-400 font-medium">{totalRecords} records</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { label: 'Present', key: 'present', color: '#E1F5EE' },
          { label: 'Absent',  key: 'absent',  color: 'rgba(239,68,68,.12)' },
          { label: 'Late',    key: 'late',    color: 'rgba(245,158,11,.12)' },
        ].map((l) => (
          <div key={l.key} className="flex items-center gap-1.5 text-[11px] text-surface-400">
            <div className="w-[9px] h-[9px] rounded-[2px]" style={{ background: l.color }} />
            {l.label}
            {stats && <span className="font-bold text-surface-500">({stats[l.key] || 0})</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {DAYS.map((d, i) => (
          <div key={`h-${i}`} className="text-[9px] font-bold text-surface-400 text-center py-0.5">
            {d}
          </div>
        ))}

        {monthDays.map((md, i) => {
          const bg = STATUS_COLORS[md.status].bg;
          const text = STATUS_COLORS[md.status].text;

          return (
            <div
              key={i}
              className="aspect-square rounded flex items-center justify-center text-[9.5px] font-semibold transition-transform duration-150 hover:scale-[1.2] cursor-default"
              style={{
                background: bg,
                color: text,
                animationDelay: `${i * 0.012}s`,
              }}
            >
              {md.day || ''}
            </div>
          );
        })}
      </div>

      {/* Summary from real stats */}
      {stats && (
        <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700 text-center">
          <span className="text-[13px] font-bold text-teal-700 dark:text-teal-400">
            {stats.attendanceRate}%
          </span>
          <span className="text-[11px] text-surface-400 ml-1.5">attendance rate</span>
        </div>
      )}
    </div>
  );
}
