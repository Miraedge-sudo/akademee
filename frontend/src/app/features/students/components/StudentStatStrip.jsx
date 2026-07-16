/**
 * StudentStatStrip — 4 KPI cards: Average, Attendance, Fees, Rank.
 */
import { useEffect, useRef } from 'react';
import { BarChart2, CalendarCheck, CreditCard, Award } from 'lucide-react';

function useCountUp(ref, target, isDecimal, suffix = '', duration = 1300) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof target !== 'number') return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = eased * target;
      el.textContent = val.toFixed(isDecimal ? 1 : 0) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(isDecimal ? 1 : 0) + suffix;
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isDecimal, suffix, duration, ref]);
}

function StatCard({ icon: Icon, iconBg, iconColor, value, isDecimal, suffix, valueColor, label, subtext, delay, isRank }) {
  const valRef = useRef(null);
  
  if (!isRank) {
    useCountUp(valRef, value, isDecimal, suffix);
  }

  return (
    <div
      className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4 shadow-sm relative overflow-hidden transition-all duration-250 hover:-translate-y-1 hover:shadow-lg group"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* shimmer */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2.5s_1.5s_ease-in-out]" />

      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
        style={{ background: iconBg }}
      >
        <Icon size={18} style={{ stroke: iconColor }} />
      </div>

      <div
        ref={!isRank ? valRef : null}
        className="text-[clamp(22px,3vw,30px)] font-extrabold leading-none mb-1 tabular-nums"
        style={{ color: valueColor || 'inherit' }}
      >
        {isRank ? value : '—'}
      </div>

      <div className="text-xs font-medium text-surface-400 dark:text-surface-300">{label}</div>
      <div className="text-[11px] text-surface-300 dark:text-surface-500 mt-1">{subtext}</div>
    </div>
  );
}

export default function StudentStatStrip({
  annualAvg = 14.2,
  attendanceRate = 94,
  feesPaidPct = 67,
  rankStr = '3rd',
}) {
  const cards = [
    {
      icon: BarChart2, iconBg: 'rgba(8,80,65,.08)', iconColor: '#085041',
      value: annualAvg, isDecimal: true, suffix: '/20',
      label: 'Annual average', subtext: '/ 20 — Very Good',
      delay: 0.04
    },
    {
      icon: CalendarCheck, iconBg: 'rgba(59,130,246,.08)', iconColor: '#3B82F6',
      value: attendanceRate, isDecimal: false, suffix: '%', valueColor: '#3B82F6',
      label: 'Attendance rate', subtext: '4 absences this year',
      delay: 0.1
    },
    {
      icon: CreditCard, iconBg: 'rgba(245,158,11,.08)', iconColor: '#F59E0B',
      value: feesPaidPct, isDecimal: false, suffix: '%', valueColor: '#F59E0B',
      label: 'Fees paid', subtext: '80 000 / 120 000 FCFA',
      delay: 0.16
    },
    {
      icon: Award, iconBg: 'rgba(139,92,246,.08)', iconColor: '#8B5CF6',
      value: rankStr, isRank: true, valueColor: '#8B5CF6',
      label: 'Class ranking', subtext: 'Form 4A · 45 students',
      delay: 0.22
    }
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
      `}</style>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>
    </>
  );
}
