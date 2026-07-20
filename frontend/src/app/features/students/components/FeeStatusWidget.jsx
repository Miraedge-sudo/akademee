/**
 * FeeStatusWidget — showing paid vs remaining fees with SVG progress ring.
 * Uses real data from the API passed via props.
 */
import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

function getStatusConfig(status, pct) {
  if (status === 'paid' || pct >= 100) {
    return { color: '#1D9E75', label: 'Paid', bg: 'bg-teal-500/10 text-teal-600' };
  }
  if (status === 'partial' || (pct > 0 && pct < 100)) {
    return { color: '#F59E0B', label: 'Partial', bg: 'bg-amber-500/10 text-amber-500' };
  }
  return { color: '#EF4444', label: 'Unpaid', bg: 'bg-red-500/10 text-red-500' };
}

export default function FeeStatusWidget({
  paid = 0,
  total = 0,
  status = 'pending',
  dueDate = '',
}) {
  const arcRef = useRef(null);
  const pct = total > 0 ? paid / total : 0;
  const pctText = Math.round(pct * 100);
  const statusCfg = getStatusConfig(status, pctText);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (arcRef.current) {
        const circumference = 226;
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
        <span className={`inline-flex text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${statusCfg.bg}`}>
          {statusCfg.label}
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
              stroke={statusCfg.color}
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
              {paid.toLocaleString('en')} FCFA
            </span>
          </div>

          <div className="flex items-center justify-between text-[12.5px]">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-[3px] mr-2" style={{ background: statusCfg.color }} />
              <span className="text-surface-500">Remaining</span>
            </div>
            <span className="font-bold" style={{ color: statusCfg.color }}>
              {Math.max(0, total - paid).toLocaleString('en')} FCFA
            </span>
          </div>

          <div className="flex items-center justify-between text-[12.5px] pt-2 border-t border-surface-100 dark:border-surface-700">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-[3px] bg-surface-300 dark:bg-surface-600 mr-2" />
              <span className="text-surface-500">Total due</span>
            </div>
            <span className="font-bold text-surface-900 dark:text-surface-100">
              {total.toLocaleString('en')} FCFA
            </span>
          </div>

          {dueDate && status !== 'paid' && (
            <div className="mt-2.5 p-2.5 bg-amber-500/10 border border-amber-500/15 rounded-md flex items-center gap-1.5 text-[11.5px] text-amber-600 dark:text-amber-500">
              <Clock size={13} className="flex-shrink-0" />
              Due by {dueDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
