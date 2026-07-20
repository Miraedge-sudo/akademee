/**
 * SequencePerformance — Animated bar chart for sequence grades over time.
 * When a per-sequence API endpoint is available, this will render real data.
 */
import { TrendingUp } from 'lucide-react';

export default function SequencePerformance({ studentId, data = [] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Performance by sequence
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <TrendingUp size={28} className="text-surface-200 dark:text-surface-600 mb-3" />
          <p className="text-sm text-surface-400">Sequence performance tracking</p>
          <p className="text-xs text-surface-300 mt-1">will be available once grades are recorded across sequences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Performance by sequence
        </div>
        <span className="text-xs text-surface-400">{new Date().getFullYear() - 1}/{new Date().getFullYear()}</span>
      </div>

      <div className="flex items-end gap-2.5 h-[130px] pb-1 flex-1">
        {data.map((s, i) => {
          const pct = (s.avg / 20) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full group">
              <div className="text-[10.5px] font-bold text-surface-700 dark:text-surface-200 mt-auto mb-1">
                {s.avg.toFixed(1)}
              </div>
              <div className="relative w-full flex flex-col justify-end" style={{ height: `${pct}%` }}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {s.avg.toFixed(1)}/20
                </div>
                <div
                  className="w-full rounded-t-[6px] origin-bottom transition-all hover:brightness-110 cursor-pointer"
                  style={{
                    height: '100%',
                    background: s.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2.5 mt-2">
        {data.map((s, i) => (
          <div key={i} className="flex-1 text-center text-[10px] font-semibold text-surface-400">
            {s.seq}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes studBarGrow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
      `}</style>
    </div>
  );
}
