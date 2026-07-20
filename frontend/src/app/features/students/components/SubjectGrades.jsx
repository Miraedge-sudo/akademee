/**
 * SubjectGrades — animated horizontal progress bars for subject averages.
 * Fetches data from the averages API if not provided as props.
 */
import { useEffect, useRef, useState } from 'react';
import { getStudentAverages } from '../../../core/api/gradeCalculationService';

function getMention(avg) {
  if (avg >= 16) return '#1D9E75';
  if (avg >= 14) return '#3B82F6';
  if (avg >= 12) return '#8B5CF6';
  if (avg >= 10) return '#F59E0B';
  return '#EF4444';
}

function GradeBar({ item, delay }) {
  const barRef = useRef(null);
  const pct = (item.average / 20) * 100;
  const color = getMention(item.average);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    }, 200 + delay * 1000);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  return (
    <div
      className="grid grid-cols-[110px_1fr_36px] sm:grid-cols-[120px_1fr_40px] items-center gap-3 mb-3 animate-[fadeUp_.5s_both]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate" title={item.subject}>
        {item.subject}
      </div>
      <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ width: '0%', background: color }}
        />
      </div>
      <div className="text-[13px] font-extrabold text-right tabular-nums" style={{ color }}>
        {item.average}
      </div>
    </div>
  );
}

export default function SubjectGrades({ averages, studentId }) {
  const [localGrades, setLocalGrades] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (averages?.subjectAverages) {
      setLocalGrades(averages.subjectAverages);
    } else if (studentId) {
      getStudentAverages(studentId)
        .then(data => setLocalGrades(data?.subjectAverages || []))
        .catch(() => setLocalGrades([]));
    }
  }, [averages, studentId]);

  const grades = localGrades || averages?.subjectAverages || [];

  if (grades.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Subject averages
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-surface-400">No grades available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Subject averages
        </div>
        <span className="text-xs text-surface-400">{grades.length} subjects</span>
      </div>

      <div className="mt-2">
        {grades.map((g, i) => (
          <GradeBar key={i} item={g} delay={0.06 * i} />
        ))}
      </div>
    </div>
  );
}
