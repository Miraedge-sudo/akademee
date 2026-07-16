/**
 * StudentSchedule — Today's classes for the student.
 */
import { useMemo } from 'react';

const SAMPLE_SCHED = [
  { time: '07:30', subj: 'Mathematics',     room: 'Room 12', color: '#085041' },
  { time: '08:45', subj: 'English Language', room: 'Room 08', color: '#3B82F6' },
  { time: '10:00', subj: 'Physics',         room: 'Lab 2',   color: '#8B5CF6' },
  { time: '11:15', subj: 'French',          room: 'Room 05', color: '#F59E0B' },
];

export default function StudentSchedule({ schedule = SAMPLE_SCHED }) {
  const dateStr = useMemo(() => {
    return new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  }, []);

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
