/**
 * AttendanceMiniCalendar — month calendar showing present/absent/late days.
 * Navigable across months (prev / next / today) so students can see every
 * recorded day, not just the current month. Fetches the student's full
 * attendance history from the API and color-codes each day.
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAttendanceStats, getStudentAttendance } from '../../../core/api/attendanceService';
import {
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
} from 'react-icons/fi';

const STATUS_COLORS = {
  present: { bg: '#D1FAE5', text: '#065F46', ring: '#10B981' },
  absent:  { bg: '#FEE2E2', text: '#991B1B', ring: '#EF4444' },
  late:    { bg: '#FEF3C7', text: '#92400E', ring: '#F59E0B' },
  excused: { bg: '#DBEAFE', text: '#1E40AF', ring: '#3B82F6' },
  empty:   { bg: '#F3F4F6', text: '#D1D5DB', ring: '#E5E7EB' },
};

function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AttendanceMiniCalendar({ studentId, attendanceStats }) {
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  const [stats, setStats] = useState(null);
  const [dailyRecords, setDailyRecords] = useState({});
  const [loading, setLoading] = useState(true);

  // View state: which month is displayed (defaults to the current month)
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const promises = [
      attendanceStats
        ? Promise.resolve(attendanceStats)
        : getAttendanceStats({ studentId }).catch(() => null),
      getStudentAttendance(studentId).catch(() => []),
    ];

    Promise.all(promises)
      .then(([statsData, attendanceRecords]) => {
        setStats(statsData);

        const arr = Array.isArray(attendanceRecords) ? attendanceRecords : [];

        const lookup = {};
        for (const rec of arr) {
          if (rec.date) {
            lookup[toDateKey(rec.date)] = rec.status;
          }
        }
        setDailyRecords(lookup);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId, attendanceStats]);

  const goPrev = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const goToday = useCallback(() => {
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, []);

  // Build the grid for the displayed month
  const monthDays = useMemo(() => {
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

    const days = [];
    const lead = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < lead; i++) {
      days.push({ day: null, status: 'empty', dateKey: null });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const status = dailyRecords[dateKey] || 'empty';
      days.push({ day: i, status, dateKey });
    }
    return days;
  }, [viewYear, viewMonth, dailyRecords]);

  // Counts for the displayed month only
  const monthCounts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const d of monthDays) {
      if (d.status && c[d.status] !== undefined) c[d.status] += 1;
    }
    return c;
  }, [monthDays]);

  const isCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const fullDayNames = useMemo(() => {
    // Monday-first weekday headers, localized
    const base = new Date(2026, 0, 5); // a Monday
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getTime() + i * 86400000).toLocaleDateString(locale, { weekday: 'short' })
    );
  }, [locale]);

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
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[15px] font-bold text-surface-900 dark:text-surface-100 capitalize">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          {monthLabel}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            title={t('student.attendance.prevMonth')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700 dark:hover:text-surface-200 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              title={t('student.attendance.today')}
              className="h-7 px-2 rounded-lg text-[11px] font-semibold text-[#085041] hover:bg-[#085041]/10 transition-colors"
            >
              {t('student.attendance.today')}
            </button>
          )}
          <button
            onClick={goNext}
            title={t('student.attendance.nextMonth')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700 dark:hover:text-surface-200 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { label: t('student.attendance.present'), key: 'present', color: '#D1FAE5' },
          { label: t('student.attendance.absent'), key: 'absent', color: 'rgba(239,68,68,.12)' },
          { label: t('student.attendance.late'), key: 'late', color: 'rgba(245,158,11,.12)' },
        ].map((l) => (
          <div key={l.key} className="flex items-center gap-1.5 text-[11px] text-surface-400">
            <div className="w-[9px] h-[9px] rounded-[2px]" style={{ background: l.color }} />
            {l.label}
            <span className="font-bold text-surface-500">({monthCounts[l.key] || 0})</span>
          </div>
        ))}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-[3px] mb-1">
        {fullDayNames.map((d, i) => (
          <div key={`h-${i}`} className="text-[9px] font-bold text-surface-400 text-center py-0.5 capitalize">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-[3px]">
        {monthDays.map((md, i) => {
          const colors = STATUS_COLORS[md.status] || STATUS_COLORS.empty;
          const isToday =
            md.dateKey &&
            md.dateKey === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          return (
            <div
              key={i}
              title={md.dateKey || ''}
              className="aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold"
              style={{
                background: colors.bg,
                color: colors.text,
                boxShadow: isToday ? `inset 0 0 0 2px ${colors.ring}` : undefined,
              }}
            >
              {md.day || ''}
            </div>
          );
        })}
      </div>

      {/* Overall summary */}
      {stats && (
        <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700 text-center">
          <span className="text-[13px] font-bold text-teal-700 dark:text-teal-400">
            {stats.attendanceRate}%
          </span>
          <span className="text-[11px] text-surface-400 ml-1.5">
            {t('student.attendance.attendanceRate').toLowerCase()}
          </span>
        </div>
      )}
    </div>
  );
}
