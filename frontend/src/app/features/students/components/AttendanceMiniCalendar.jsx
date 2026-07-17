/**
 * AttendanceMiniCalendar — simple grid showing present/absent/late days for the month.
 */
import { useMemo } from 'react';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const STATUS_COLORS = {
  present: { bg: '#E1F5EE', text: '#085041' },
  absent:  { bg: 'rgba(239,68,68,.12)', text: '#EF4444' },
  late:    { bg: 'rgba(245,158,11,.12)', text: '#F59E0B' },
  empty:   { bg: '#F7F8F6', text: '#BFC4BB' }, // light surface-50 / 300
};

// Generate deterministic mock data
function generateStatuses() {
  return Array.from({ length: 31 }, (_, i) => {
    if (i < 1 || i > 28) return 'empty';
    const r = (Math.sin(i) + 1) / 2; // deterministic "random"
    if (r < 0.8) return 'present';
    if (r < 0.88) return 'absent';
    if (r < 0.94) return 'late';
    return 'empty';
  });
}

export default function AttendanceMiniCalendar() {
  const statuses = useMemo(() => generateStatuses(), []);

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Attendance — Jan 2025
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { label: 'Present', color: '#E1F5EE' },
          { label: 'Absent',  color: 'rgba(239,68,68,.12)' },
          { label: 'Late',    color: 'rgba(245,158,11,.12)' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-surface-400">
            <div className="w-[9px] h-[9px] rounded-[2px]" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {/* Header row */}
        {DAYS.map((d, i) => (
          <div key={`h-${i}`} className="text-[9px] font-bold text-surface-400 text-center py-0.5">
            {d}
          </div>
        ))}

        {/* Days */}
        {statuses.map((s, i) => {
          const isDark = document.documentElement.classList.contains('dark');
          // For empty days in dark mode, use a slightly darker empty bg
          let bg = STATUS_COLORS[s].bg;
          let text = STATUS_COLORS[s].text;
          if (s === 'empty' && isDark) {
            bg = '#2A3029'; // surface-800 or 900
            text = '#434D45'; // surface-700
          }

          return (
            <div
              key={i}
              className="aspect-square rounded flex items-center justify-center text-[9.5px] font-semibold transition-transform duration-150 hover:scale-[1.2] cursor-default animate-[fadeUp_.5s_both]"
              style={{
                background: bg,
                color: text,
                animationDelay: `${i * 0.012}s`,
              }}
              title={s.charAt(0).toUpperCase() + s.slice(1)}
            >
              {s !== 'empty' ? i + 1 : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
