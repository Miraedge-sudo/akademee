import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CLASS_DATA = {
  'Form 4A': {
    subjects: ['Maths', 'English', 'Physics', 'Chem.', 'Bio.', 'French', 'Hist.', 'Geo.'],
    averages: [13.2, 15.4, 11.8, 12.6, 14.1, 13.8, 15.0, 12.2],
  },
  'Form 3B': {
    subjects: ['Maths', 'English', 'Physics', 'Chem.', 'Geo.', 'French', 'Hist.'],
    averages: [12.0, 14.1, 9.5, 11.3, 13.7, 12.9, 11.2],
  },
  'Form 5A': {
    subjects: ['Maths', 'Comp. Sci.', 'Physics', 'Chem.', 'Bio.', 'English'],
    averages: [14.8, 16.2, 13.5, 12.0, 15.1, 14.3],
  },
};

const CLASS_OPTIONS = Object.keys(CLASS_DATA);

function getColor(avg) {
  if (avg >= 12) return { bar: '#1D9E75', label: 'pass' };
  if (avg >= 10) return { bar: '#F59E0B', label: 'risk' };
  return { bar: '#EF4444', label: 'fail' };
}

export default function ClassPerformanceChart() {
  const { t } = useTranslation('common');
  const [selected, setSelected] = useState(CLASS_OPTIONS[0]);
  const data = CLASS_DATA[selected];

  let pass = 0, fail = 0, risk = 0;
  data.averages.forEach((avg) => {
    if (avg >= 12) pass++;
    else if (avg >= 10) risk++;
    else fail++;
  });

  const maxAvg = 20;

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          {t('teacher.performance.title')}
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-md border-[1.5px] border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200 cursor-pointer focus:outline-none"
        >
          {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex gap-4 mb-4">
        {[
          { color: '#1D9E75', label: t('teacher.performance.pass') },
          { color: '#EF4444', label: t('teacher.performance.fail') },
          { color: '#F59E0B', label: t('teacher.performance.atRisk') },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-[11.5px] text-surface-400">
            <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="flex items-end gap-1.5 h-[140px]">
        {data.averages.map((avg, i) => {
          const { bar } = getColor(avg);
          const pct = (avg / maxAvg) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div className="relative flex flex-col justify-end w-full" style={{ height: `${pct}%` }}>
                {/* tooltip */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {avg.toFixed(1)}/20
                </div>
                <div
                  className="w-full rounded-t-[6px] origin-bottom hover:brightness-110 transition-all"
                  style={{
                    height: '100%',
                    background: bar,
                    animation: `barGrow .7s ${0.06 * i}s cubic-bezier(.16,1,.3,1) both`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-1.5 mt-2">
        {data.subjects.map((s, i) => (
          <div key={i} className="flex-1 text-center text-[10.5px] text-surface-400 font-medium truncate">{s}</div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
        {[
          { value: pass, label: t('teacher.performance.passed'),  color: '#1D9E75' },
          { value: fail, label: t('teacher.performance.failed'),  color: '#EF4444' },
          { value: risk, label: t('teacher.performance.atRiskLabel'), color: '#F59E0B' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-[20px] font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-surface-400">{s.label}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes barGrow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
      `}</style>
    </div>
  );
}
