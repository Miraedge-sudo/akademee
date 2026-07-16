/**
 * TeacherStatCards — 4 animated KPI cards: classes, students, grades pending, attendance rate.
 */
import { useEffect, useRef } from 'react';
import {
  BookOpen,
  Users,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const SPARK_PATHS = {
  classes:    'M0,28 L16,24 L33,20 L50,22 L66,14 L83,10 L100,8',
  students:   'M0,30 L16,26 L33,28 L50,18 L66,20 L83,14 L100,12',
  grades:     'M0,10 L16,14 L33,12 L50,20 L66,16 L83,24 L100,28',
  attendance: 'M0,24 L16,20 L33,22 L50,14 L66,12 L83,8 L100,6',
};

function SparkLine({ path, color, fill }) {
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="w-full h-9 overflow-visible">
      <polyline
        points={path + ' 100,36 0,36'}
        fill={fill || 'transparent'}
        stroke="none"
      />
      <polyline
        points={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="200"
        strokeDashoffset="200"
        style={{ animation: 'drawLine 1.2s .5s cubic-bezier(.16,1,.3,1) forwards' }}
      />
    </svg>
  );
}

function useCountUp(ref, target, suffix = '', duration = 1200) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, suffix, duration, ref]);
}

function StatCard({ icon: Icon, iconBg, iconColor, value, suffix = '', label, trend, trendUp, sparkKey, sparkColor, sparkFill, valueColor, delay = 0 }) {
  const valRef = useRef(null);
  useCountUp(valRef, value, suffix);

  return (
    <div
      className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm relative overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2.5s_1s_ease-in-out]" />

      <div className="flex items-start justify-between mb-3.5">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon size={18} style={{ stroke: iconColor }} />
        </div>
        {trend && (
          <span
            className={`text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-full ${
              trendUp
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-500'
            }`}
          >
            {trendUp ? <TrendingUp size={10} /> : <AlertCircle size={10} />}
            {trend}
          </span>
        )}
      </div>

      <div
        ref={valRef}
        className="text-[clamp(26px,3vw,34px)] font-extrabold leading-none mb-1"
        style={{ color: valueColor || '#1A1F1B' }}
      >
        0
      </div>
      <div className="text-[12px] text-surface-400 font-medium">{label}</div>

      <div className="mt-3 h-9">
        <SparkLine path={SPARK_PATHS[sparkKey]} color={sparkColor} fill={sparkFill} />
      </div>
    </div>
  );
}

export default function TeacherStatCards({ stats }) {
  const { classes = 6, students = 187, pendingGrades = 12, attendanceRate = 94 } = stats || {};

  const cards = [
    {
      icon: BookOpen, iconBg: 'rgba(8,80,65,.08)', iconColor: '#085041',
      value: classes, label: 'Classes assigned', trend: '+2', trendUp: true,
      sparkKey: 'classes', sparkColor: '#5DCAA5', sparkFill: 'rgba(8,80,65,.06)',
      delay: 0.04,
    },
    {
      icon: Users, iconBg: 'rgba(59,130,246,.09)', iconColor: '#3B82F6',
      value: students, label: 'Total students', trend: '+8', trendUp: true,
      sparkKey: 'students', sparkColor: '#3B82F6',
      delay: 0.1,
    },
    {
      icon: ClipboardList, iconBg: 'rgba(245,158,11,.09)', iconColor: '#F59E0B',
      value: pendingGrades, label: 'Grades to enter', trend: 'Urgent', trendUp: false,
      sparkKey: 'grades', sparkColor: '#F59E0B', valueColor: '#F59E0B',
      delay: 0.16,
    },
    {
      icon: CheckCircle2, iconBg: 'rgba(139,92,246,.09)', iconColor: '#8B5CF6',
      value: attendanceRate, suffix: '%', label: 'Avg. attendance rate', trend: '+3%', trendUp: true,
      sparkKey: 'attendance', sparkColor: '#8B5CF6',
      delay: 0.22,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes drawLine { from { stroke-dashoffset: 200 } to { stroke-dashoffset: 0 } }
        @keyframes shimmer  { 0%{ transform:translateX(-100%) } 100%{ transform:translateX(100%) } }
      `}</style>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
    </>
  );
}
