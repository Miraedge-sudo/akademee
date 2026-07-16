/**
 * FeeStatusWidget — showing paid vs remaining fees with SVG progress ring.
 */
import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export default function FeeStatusWidget({
  paid = 80000,
  remaining = 40000,
  total = 120000,
  dueDate = 'February 28, 2025'
}) {
  const arcRef = useRef(null);
  const pct = paid / total;
  const pctText = Math.round(pct * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (arcRef.current) {
        const circumference = 226; // 2 * PI * 36
        arcRef.current.style.setProperty('--target', circumference * (1 - pct));
        arcRef.current.style.animation = 'studentDrawLine 1.4s cubic-bezier(.16,1,.3,1) forwards';
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Fee status
        </div>
        <span className="inline-flex text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
          Partial
        </span>
      </div>

      <div className="flex items-center gap-5 py-2">
        {/* Ring */}
        <div className="relative w-[90px] h-[90px] flex-shrink-0">
          <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
            <circle
              cx="45" cy="45" r="36"
              fill="none"
              stroke="var(--surface-100, #EEF0EC)"
              className="dark:stroke-surface-700"
              strokeWidth="9"
            />
            <circle
              ref={arcRef}
              cx="45" cy="45" r="36"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="226"
              strokeDashoffset="226"
              style={{ '--full': 226, '--target': 226 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-[18px] font-extrabold text-surface-900 dark:text-surface-100 leading-none">
              {pctText}%
            </div>
            <div className="text-[9px] font-semibold tracking-[0.8px] uppercase text-surface-400 mt-0.5">
              Paid
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[12.5px]">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-[3px] bg-teal-600 mr-2" />
              <span className="text-surface-500">Paid</span>
            </div>
            <span className="font-bold text-teal-700 dark:text-teal-400">
              {paid.toLocaleString('fr')} FCFA
            </span>
          </div>

          <div className="flex items-center justify-between text-[12.5px]">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-[3px] bg-amber-500 mr-2" />
              <span className="text-surface-500">Remaining</span>
            </div>
            <span className="font-bold text-amber-500">
              {remaining.toLocaleString('fr')} FCFA
            </span>
          </div>

          <div className="flex items-center justify-between text-[12.5px] pt-2 border-t border-surface-100 dark:border-surface-700">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-[3px] bg-surface-300 dark:bg-surface-600 mr-2" />
              <span className="text-surface-500">Total due</span>
            </div>
            <span className="font-bold text-surface-900 dark:text-surface-100">
              {total.toLocaleString('fr')} FCFA
            </span>
          </div>

          <div className="mt-2.5 p-2.5 bg-amber-500/10 border border-amber-500/15 rounded-md flex items-center gap-1.5 text-[11.5px] text-amber-600 dark:text-amber-500">
            <Clock size={13} className="flex-shrink-0" />
            Due by {dueDate}
          </div>
        </div>
      </div>
    </div>
  );
}
