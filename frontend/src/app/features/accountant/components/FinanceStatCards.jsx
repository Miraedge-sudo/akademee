import { useEffect, useRef } from 'react';
import { Banknote, AlertTriangle, Percent, Receipt, TrendingUp, Users, Clock } from 'lucide-react';

const SPARK_PATHS = {
  collected:   'M0,28 L16,22 L33,18 L50,20 L66,12 L83,8 L100,4',
  outstanding: 'M0,8 L16,12 L33,10 L50,16 L66,14 L83,20 L100,24',
  rate:        'M0,24 L16,20 L33,22 L50,14 L66,12 L83,8 L100,6',
  today:       'M0,26 L16,20 L33,24 L50,16 L66,18 L83,10 L100,8',
};

function SparkLine({ pathKey, color }) {
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-8 overflow-visible">
      {pathKey === 'collected' && (
        <polyline
          points={SPARK_PATHS.collected + ' 100,32 0,32'}
          fill="rgba(8,80,65,.05)"
          stroke="none"
        />
      )}
      <polyline
        points={SPARK_PATHS[pathKey]}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="220"
        strokeDashoffset="220"
        opacity={pathKey === 'collected' ? 1 : 0.55}
        style={{ animation: 'acctDrawLine 1.3s .6s cubic-bezier(.16,1,.3,1) forwards' }}
      />
    </svg>
  );
}

function useCountUp(ref, target, suffix = '', prefix = '', duration = 1400) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(eased * target);
      el.textContent = prefix + val.toLocaleString('fr') + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toLocaleString('fr') + suffix;
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, suffix, prefix, duration, ref]);
}

function KpiCard({ icon: Icon, iconBg, iconColor, valueTarget, valueSuffix = '', valuePrefix = '', valueColor, label, trendIcon: TrendIcon, trendText, trendBg, trendColor, sparkKey, sparkColor, delay = 0 }) {
  const valRef = useRef(null);
  useCountUp(valRef, valueTarget, valueSuffix, valuePrefix);

  return (
    <div
      className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm relative overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* shimmer */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[acctShimmer_2.5s_1.2s_ease-in-out]" />

      <div
        className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3.5"
        style={{ background: iconBg }}
      >
        <Icon size={19} style={{ stroke: iconColor }} />
      </div>

      <div
        ref={valRef}
        className="text-[clamp(18px,2.5vw,26px)] font-extrabold leading-tight mb-0.5 tabular-nums"
        style={{ color: valueColor || 'inherit' }}
      >
        0
      </div>
      <div className="text-[12px] text-surface-400 font-medium mb-2.5">{label}</div>

      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: trendBg, color: trendColor }}
      >
        <TrendIcon size={10} />
        {trendText}
      </span>

      <div className="mt-2.5">
        <SparkLine pathKey={sparkKey} color={sparkColor} />
      </div>
    </div>
  );
}

export default function FinanceStatCards({ stats }) {
  const {
    totalCollected = 7200000,
    outstanding = 2640000,
    collectionRate = 73,
    paymentsToday = 8,
  } = stats || {};

  const cards = [
    {
      icon: Banknote, iconBg: 'rgba(8,80,65,.07)', iconColor: '#085041',
      valueTarget: totalCollected, valueSuffix: ' FCFA',
      label: 'Total collected (FCFA)',
      trendIcon: TrendingUp, trendText: '+18% vs last year',
      trendBg: 'rgba(29,158,117,.1)', trendColor: '#1D9E75',
      sparkKey: 'collected', sparkColor: '#5DCAA5', delay: 0.04,
    },
    {
      icon: AlertTriangle, iconBg: 'rgba(239,68,68,.08)', iconColor: '#EF4444',
      valueTarget: outstanding, valueSuffix: ' FCFA', valueColor: '#EF4444',
      label: 'Outstanding fees (FCFA)',
      trendIcon: Users, trendText: '47 students',
      trendBg: 'rgba(239,68,68,.08)', trendColor: '#EF4444',
      sparkKey: 'outstanding', sparkColor: '#EF4444', delay: 0.1,
    },
    {
      icon: Percent, iconBg: 'rgba(59,130,246,.08)', iconColor: '#3B82F6',
      valueTarget: collectionRate, valueSuffix: '%', valueColor: '#3B82F6',
      label: 'Collection rate',
      trendIcon: TrendingUp, trendText: '+6% this term',
      trendBg: 'rgba(59,130,246,.08)', trendColor: '#3B82F6',
      sparkKey: 'rate', sparkColor: '#3B82F6', delay: 0.16,
    },
    {
      icon: Receipt, iconBg: 'rgba(139,92,246,.08)', iconColor: '#8B5CF6',
      valueTarget: paymentsToday,
      label: 'Payments today',
      trendIcon: Clock, trendText: 'Last at 10:42',
      trendBg: 'rgba(139,92,246,.08)', trendColor: '#8B5CF6',
      sparkKey: 'today', sparkColor: '#8B5CF6', delay: 0.22,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes acctDrawLine { from { stroke-dashoffset: 220 } to { stroke-dashoffset: 0 } }
        @keyframes acctShimmer  { 0%{ transform:translateX(-100%) } 100%{ transform:translateX(100%) } }
      `}</style>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {cards.map((c) => <KpiCard key={c.label} {...c} />)}
      </div>
    </>
  );
}
