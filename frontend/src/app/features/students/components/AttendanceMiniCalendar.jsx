/**
 * AttendanceMiniCalendar — simple grid showing present/absent/late days for the month.
 * Fetches real attendance data from the API and color-codes each day.
 */
import { useEffect, useState, useMemo } from 'react';
import { getAttendanceStats, getStudentAttendance } from '../../../core/api/attendanceService';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const STATUS_COLORS = {
  present: { bg: '#D1FAE5', text: '#065F46' },
  absent:  { bg: '#FEE2E2', text: '#991B1B' },
  late:    { bg: '#FEF3C7', text: '#92400E' },
  excused: { bg: '#DBEAFE', text: '#1E40AF' },
  empty:   { bg: '#F3F4F6', text: '#D1D5DB' },
};

export default function AttendanceMiniCalendar({ studentId, attendanceStats }) {
  const [stats, setStats] = useState(null);
  const [dailyRecords, setDailyRecords] = useState({}); // date string -> status
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch both aggregated stats AND per-day records
    const promises = [
      attendanceStats
        ? Promise.resolve(attendanceStats)
        : getAttendanceStats({ studentId }).catch(() => null),
      getStudentAttendance(studentId).catch(() => []),
    ];

    Promise.all(promises)
      .then(([statsData, attendanceRecords]) => {
        setStats(statsData);
        
        // Build date -> status lookup
        const records = Array.isArray(attendanceRecords) ? attendanceRecords : [];
        const lookup = {};
        for (const rec of records) {
          if (rec.date) {
            // Normalize the date to YYYY-MM-DD format
            const d = new Date(rec.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            lookup[key] = rec.status;
          }
        }
        setDailyRecords(lookup);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId, attendanceStats]);

  // Build a visual representation of the month's attendance with real data
  const monthDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

    const days = [];
    // Empty cells before first day
    for (let i = 0; i < (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1); i++) {
      days.push({ day: null, status: 'empty' });
    }
    // Actual days — check if there's an attendance record for each date
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const recordStatus = dailyRecords[dateKey] || 'empty';
      days.push({ day: i, status: recordStatus });
    }

    return days;
  }, [dailyRecords]);

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
