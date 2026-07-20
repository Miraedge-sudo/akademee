/**
 * TopStudents — ranked list with avatar initials, average, and animated progress bar.
 */
import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SAMPLE_STUDENTS = [
  { name: 'Alice Mbarga', cls: 'Form 4A', avg: 17.4, avatarBg: '#E1F5EE', avatarText: '#085041' },
  { name: 'Paul Effa',    cls: 'Form 3B', avg: 16.8, avatarBg: '#EFF6FF', avatarText: '#3B82F6' },
  { name: 'Grace Nkolo',  cls: 'Form 5A', avg: 15.9, avatarBg: '#F5F3FF', avatarText: '#8B5CF6' },
  { name: 'Marc Biya',    cls: 'Form 4A', avg: 15.2, avatarBg: '#FFF7ED', avatarText: '#F59E0B' },
  { name: 'Sophie Talla', cls: 'Form 3B', avg: 14.8, avatarBg: '#E1F5EE', avatarText: '#085041' },
];

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('');
}

function StudentRow({ student, rank }) {
  const barRef = useRef(null);
  const pct = (student.avg / 20) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    }, 300 + rank * 80);
    return () => clearTimeout(timer);
  }, [pct, rank]);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors cursor-pointer group">
      {/* Rank */}
      <span className="text-[12px] font-semibold text-surface-400 w-5 text-center flex-shrink-0">{rank}</span>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold"
        style={{ background: student.avatarBg, color: student.avatarText }}
      >
        {initials(student.name)}
      </div>

      {/* Name + class */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate">{student.name}</div>
        <div className="text-[11.5px] text-surface-400">{student.cls}</div>
      </div>

      {/* Bar + score */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-[80px] h-[5px] bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
          <div
            ref={barRef}
            className="h-full rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)]"
            style={{ width: '0%', background: student.avatarText }}
          />
        </div>
        <span
          className="text-[14px] font-extrabold tabular-nums w-8 text-right"
          style={{ color: student.avatarText }}
        >
          {student.avg}
        </span>
      </div>
    </div>
  );
}

export default function TopStudents({ students = SAMPLE_STUDENTS }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          {t('teacher.topStudents.title')}
        </div>
        <button
          onClick={() => navigate('/dashboard/students')}
          className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:gap-2 transition-all"
        >
          {t('teacher.topStudents.viewAll')} <ArrowRight size={13} />
        </button>
      </div>

      <div className="flex flex-col">
        {students.map((s, i) => (
          <StudentRow key={i} student={s} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
