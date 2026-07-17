/**
 * SubjectGrades — animated horizontal progress bars for term subject averages.
 */
import { useEffect, useRef, useState } from 'react';

const SAMPLE_GRADES = [
  { subj: 'Mathematics', avg: 14, coeff: 4 },
  { subj: 'English',     avg: 17, coeff: 3 },
  { subj: 'Physics',     avg: 12, coeff: 3 },
  { subj: 'Chemistry',   avg: 11, coeff: 3 },
  { subj: 'Biology',     avg: 15, coeff: 2 },
  { subj: 'French',      avg: 13, coeff: 2 },
  { subj: 'History',     avg: 14, coeff: 2 },
  { subj: 'Geography',   avg: 16, coeff: 2 },
];

function getMention(avg) {
  if (avg >= 16) return '#1D9E75'; // Excellent
  if (avg >= 14) return '#3B82F6'; // Very Good
  if (avg >= 12) return '#8B5CF6'; // Good
  if (avg >= 10) return '#F59E0B'; // Average
  return '#EF4444'; // Fail
}

function GradeBar({ item, delay }) {
  const barRef = useRef(null);
  const pct = (item.avg / 20) * 100;
  const color = getMention(item.avg);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    }, 200 + delay * 1000); // ms
    return () => clearTimeout(timer);
  }, [pct, delay]);

  return (
    <div
      className="grid grid-cols-[110px_1fr_36px] sm:grid-cols-[120px_1fr_40px] items-center gap-3 mb-3 animate-[fadeUp_.5s_both]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate" title={item.subj}>
        {item.subj}
      </div>
      <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ width: '0%', background: color }}
        />
      </div>
      <div className="text-[13px] font-extrabold text-right tabular-nums" style={{ color }}>
        {item.avg}
      </div>
    </div>
  );
}

export default function SubjectGrades({ grades = SAMPLE_GRADES }) {
  const [filter, setFilter] = useState('Term 1');

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Subject averages
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-md border-[1.5px] border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200 cursor-pointer focus:outline-none"
        >
          <option>Term 1</option>
          <option>Term 2</option>
          <option>Annual</option>
        </select>
      </div>

      <div className="mt-2">
        {grades.map((g, i) => (
          <GradeBar key={i} item={g} delay={0.06 * i} />
        ))}
      </div>
    </div>
  );
}
