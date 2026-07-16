/**
 * SequencePerformance — Animated bar chart for sequence grades over time.
 */
import { TrendingUp } from 'lucide-react';

const SEQ_DATA = [
  { seq: 'Seq 1', avg: 12.8, color: '#3B82F6' },
  { seq: 'Seq 2', avg: 13.5, color: '#3B82F6' },
  { seq: 'Seq 3', avg: 13.1, color: '#3B82F6' },
  { seq: 'Seq 4', avg: 14.2, color: '#1D9E75' },
  { seq: 'Seq 5', avg: 14.8, color: '#1D9E75' },
  { seq: 'Seq 6', avg: 15.2, color: '#1D9E75' },
];

export default function SequencePerformance({ data = SEQ_DATA }) {
  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Performance by sequence
        </div>
        <span className="text-xs text-surface-400">2024/2025</span>
      </div>

      <div className="flex items-end gap-2.5 h-[130px] pb-1 flex-1">
        {data.map((s, i) => {
          const pct = (s.avg / 20) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full group">
              {/* Value top */}
              <div className="text-[10.5px] font-bold text-surface-700 dark:text-surface-200 mt-auto mb-1">
                {s.avg}
              </div>
              
              {/* Bar */}
              <div className="relative w-full flex flex-col justify-end" style={{ height: `${pct}%` }}>
                {/* Tooltip */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {s.avg}/20
                </div>
                <div
                  className="w-full rounded-t-[6px] origin-bottom transition-all hover:brightness-110 cursor-pointer"
                  style={{
                    height: '100%',
                    background: s.color,
                    animation: `studBarGrow .7s ${0.07 * i}s cubic-bezier(.16,1,.3,1) both`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-2.5 mt-2">
        {data.map((s, i) => (
          <div key={i} className="flex-1 text-center text-[10px] font-semibold text-surface-400">
            {s.seq}
          </div>
        ))}
      </div>

      {/* Trend summary */}
      <div className="flex items-center gap-2 mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/50">
        <TrendingUp size={16} className="text-teal-900 dark:text-teal-400 flex-shrink-0" />
        <span className="text-[13px] font-semibold text-teal-900 dark:text-teal-400">
          Improving trend — +1.2 pts over last 3 sequences
        </span>
      </div>

      <style>{`
        @keyframes studBarGrow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
      `}</style>
    </div>
  );
}
