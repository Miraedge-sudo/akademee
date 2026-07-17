/**
 * MonthlyCollectionsChart — animated bar chart of monthly fee collections.
 */
import { useState } from 'react';

const ALL_DATA = {
  'All classes': [820000, 1100000, 960000, 1240000, 1320000, 980000, 780000],
  'Form 4':      [200000,  310000, 280000,  360000,  390000, 290000, 230000],
  'Form 5':      [180000,  260000, 220000,  300000,  340000, 250000, 200000],
};
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const CURRENT_MONTH_IDX = 4; // Jan is the "latest"

function fmt(n) { return (n / 1000).toFixed(0) + 'K'; }

export default function MonthlyCollectionsChart() {
  const [filter, setFilter] = useState('All classes');
  const amounts = ALL_DATA[filter];
  const maxAmt = Math.max(...amounts);

  const totalCollected = 7200000;
  const outstanding    = 2640000;
  const collectionRate = 73;

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Monthly collections — 2024/2025
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-md border-[1.5px] border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200 cursor-pointer focus:outline-none"
        >
          {Object.keys(ALL_DATA).map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>

      <div className="flex items-end gap-2 h-[140px] mb-2">
        {amounts.map((amt, i) => {
          const pct = (amt / maxAmt) * 100;
          const isCurrent = i === CURRENT_MONTH_IDX;
          return (
            <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">

              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {fmt(amt)} FCFA
              </div>
              <div
                className="w-full rounded-t-[6px] origin-bottom transition-all hover:brightness-110 cursor-pointer"
                style={{
                  height: `${Math.max(pct, 4)}%`,
                  background: isCurrent ? '#1D9E75' : 'var(--surface-100, #EEF0EC)',
                  animation: `acctBarGrow .8s ${0.07 * i}s cubic-bezier(.16,1,.3,1) both`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4">
        {MONTHS.map((m, i) => (
          <div
            key={m}
            className="flex-1 text-center text-[10.5px] truncate"
            style={{
              fontWeight: i === CURRENT_MONTH_IDX ? 700 : 500,
              color: i === CURRENT_MONTH_IDX ? '#085041' : '#9BA59C',
            }}
          >
            {m}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-surface-100 dark:border-surface-700">
        <div className="text-center">
          <div className="text-sm font-extrabold text-teal-600">{(totalCollected / 1000000).toFixed(1)}M</div>
          <div className="text-[11px] text-surface-400 mt-0.5">Total collected</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-extrabold text-red-500">{(outstanding / 1000000).toFixed(1)}M</div>
          <div className="text-[11px] text-surface-400 mt-0.5">Outstanding</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-extrabold text-blue-500">{collectionRate}%</div>
          <div className="text-[11px] text-surface-400 mt-0.5">Collection rate</div>
        </div>
      </div>

      <style>{`
        @keyframes acctBarGrow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
      `}</style>
    </div>
  );
}
