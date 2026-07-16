
import { useMemo } from 'react';

function fmt(n) {
  return n.toLocaleString('fr');
}

export default function AccountantGreeting({ unpaidCount = 47, monthRevenue = 1240000, pc = '#085041' }) {
  const now = new Date();
  const dateDay = now.getDate();
  const dateMonth = now.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const year = useMemo(() => {
    const y = now.getFullYear();
    return `${y - 1} – ${y}`;
  }, []);

  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-7">
      {/* Left */}
      <div className="animate-[fadeUp_.55s_cubic-bezier(.16,1,.3,1)_both]">
        <p
          className="text-[11px] font-semibold tracking-[1.5px] uppercase mb-1.5"
          style={{ color: pc }}
        >
          Finance dashboard
        </p>
        <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-surface-900 dark:text-surface-50 leading-tight">
          Finance overview,{' '}
          <span style={{ color: pc }}>{year}</span>
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          <strong className="text-surface-700 dark:text-surface-200">{unpaidCount} students</strong>{' '}
          with outstanding fees ·{' '}
          <strong className="text-teal-700 dark:text-teal-400">{fmt(monthRevenue)} FCFA</strong>{' '}
          collected this month
        </p>
      </div>

      {/* Right — date badge */}
      <div className="animate-[fadeUp_.55s_.08s_cubic-bezier(.16,1,.3,1)_both] flex-shrink-0">
        <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl px-5 py-3 text-right shadow-sm">
          <div className="font-display text-[28px] font-bold text-surface-900 dark:text-surface-50 leading-none">{dateDay}</div>
          <div className="text-[10px] font-semibold tracking-[1.2px] uppercase text-surface-400 mt-1">{dateMonth}</div>
        </div>
      </div>
    </div>
  );
}
