import { useEffect, useRef } from 'react';

const SAMPLE_CLASSES = [
  { name: 'Form 4A',       paid: 980000,  total: 1200000, color: '#1D9E75' },
  { name: 'Form 5A',       paid: 760000,  total: 1000000, color: '#3B82F6' },
  { name: 'Form 3B',       paid: 840000,  total:  960000, color: '#8B5CF6' },
  { name: 'Lower 6th Sci.',paid: 620000,  total:  900000, color: '#F59E0B' },
  { name: 'Form 1A',       paid: 980000,  total: 1000000, color: '#1D9E75' },
];

function pctColor(pct) {
  if (pct >= 90) return '#1D9E75';
  if (pct >= 70) return '#3B82F6';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

function ProgressBar({ cls }) {
  const barRef = useRef(null);
  const pct = Math.round((cls.paid / cls.total) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    }, 300);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-semibold text-surface-900 dark:text-surface-100">{cls.name}</span>
        <span className="text-[12px] font-bold" style={{ color: pctColor(pct) }}>{pct}%</span>
      </div>
      <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full transition-[width] duration-[1300ms] ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ width: '0%', background: cls.color }}
        />
      </div>
      <div className="text-[11.5px] text-surface-400 mt-1">
        {(cls.paid / 1000).toFixed(0)}K / {(cls.total / 1000).toFixed(0)}K FCFA
      </div>
    </div>
  );
}

export default function FeeCollectionByClass({ classes = SAMPLE_CLASSES }) {
  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-5">
        <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
        Collection by class
      </div>
      {classes.map((cls, i) => <ProgressBar key={i} cls={cls} />)}
    </div>
  );
}
