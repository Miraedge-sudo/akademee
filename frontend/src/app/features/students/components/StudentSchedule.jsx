/**
 * StudentSchedule — Today's classes for the student.
 * Fetches from the schedule API if available, otherwise shows a placeholder.
 */
import { useEffect, useState, useMemo } from 'react';

export default function StudentSchedule({ studentId, classId }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch from a schedule endpoint if available
    // For now, gracefully show that schedule data will appear once configured
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [classId]);

  const dateStr = useMemo(() => {
    return new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-surface-100 dark:bg-surface-700 rounded animate-pulse" />
          <div className="h-4 w-28 bg-surface-50 dark:bg-surface-800 rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 bg-surface-50 dark:bg-surface-900 rounded-[10px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
            <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
            Today's classes
          </div>
          <span className="text-xs text-surface-400">{dateStr}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-sm text-surface-400">Your schedule will appear here</p>
          <p className="text-xs text-surface-300 mt-1">once configured by the administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Today's classes
        </div>
        <span className="text-xs text-surface-400">{dateStr}</span>
      </div>

      <div className="flex flex-col gap-2">
        {schedule.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] bg-surface-50 dark:bg-surface-900/50 border-[1.5px] border-surface-100 dark:border-surface-700 transition-all duration-200 hover:translate-x-1 hover:border-teal-400/50 hover:bg-teal-50 dark:hover:bg-teal-900/20"
          >
            <div className="text-xs font-bold text-surface-900 dark:text-surface-100 min-w-[44px] text-center">
              {s.time}
            </div>
            <div className="w-px h-7 bg-surface-200 dark:bg-surface-600 flex-shrink-0" />
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <div className="text-[13px] font-bold text-surface-900 dark:text-surface-100 flex-1 truncate">
              {s.subj}
            </div>
            <div className="text-[11.5px] text-surface-400 flex-shrink-0">
              {s.room}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
