import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LEVEL_STYLE = {
  critical: { bg: 'rgba(239,68,68,.08)', text: '#EF4444', label: 'Critical' },
  high:     { bg: 'rgba(245,158,11,.08)', text: '#F59E0B', label: 'High' },
  medium:   { bg: 'rgba(59,130,246,.08)',  text: '#3B82F6', label: 'Medium' },
  low:      { bg: 'rgba(139,92,246,.08)',  text: '#8B5CF6', label: 'Low' },
};

const SAMPLE_DEFAULTERS = [
  { name: 'Jean-Marc Essomba', cls: 'Form 4A',   amount: 80000, since: 'Oct 2024', level: 'critical', avatarBg: '#FEE2E2', avatarText: '#EF4444' },
  { name: 'Alice Ndongo',      cls: 'Form 5A',   amount: 60000, since: 'Nov 2024', level: 'high',     avatarBg: '#FEF3C7', avatarText: '#F59E0B' },
  { name: 'Paul Eko',          cls: 'Form 3B',   amount: 40000, since: 'Dec 2024', level: 'medium',   avatarBg: '#EFF6FF', avatarText: '#3B82F6' },
  { name: 'Marie Abena',       cls: 'Lower 6th', amount: 40000, since: 'Dec 2024', level: 'medium',   avatarBg: '#EFF6FF', avatarText: '#3B82F6' },
  { name: 'Chris Bilong',      cls: 'Form 1A',   amount: 20000, since: 'Jan 2025', level: 'low',      avatarBg: '#F5F3FF', avatarText: '#8B5CF6' },
];

const AVATAR_PALETTE = [
  { bg: '#FEE2E2', text: '#EF4444' },
  { bg: '#FEF3C7', text: '#F59E0B' },
  { bg: '#EFF6FF', text: '#3B82F6' },
  { bg: '#F5F3FF', text: '#8B5CF6' },
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FCE7F3', text: '#EC4899' },
];

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('');
}

function normalizeDefaulter(d, idx) {
  const av = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  return {
    name: d.name,
    cls: d.cls || d.className || '',
    amount: d.amount,
    since: d.since || '',
    level: d.level || 'medium',
    avatarBg: d.avatarBg || av.bg,
    avatarText: d.avatarText || av.text,
  };
}

export default function OutstandingAlerts({ defaulters: rawDefaulters }) {
  const defaulters = (rawDefaulters || SAMPLE_DEFAULTERS).map((d, i) => normalizeDefaulter(d, i));
  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Outstanding fees — Priority alerts
        </div>
        <Link
          to="/dashboard/finance"
          className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:gap-2 transition-all"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {defaulters.map((d, i) => {
          const lc = LEVEL_STYLE[d.level] || LEVEL_STYLE.low;
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3.5 rounded-[10px] cursor-pointer transition-transform duration-200 hover:translate-x-1"
              style={{ background: lc.bg }}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[12px] font-extrabold"
                style={{ background: d.avatarBg, color: d.avatarText }}
              >
                {initials(d.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-surface-900 dark:text-surface-100 truncate">{d.name}</div>
                <div className="text-[11.5px] text-surface-500">{d.cls} · Since {d.since}</div>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[14px] font-extrabold" style={{ color: lc.text }}>
                  {d.amount.toLocaleString('fr')} F
                </span>
                <span
                  className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: lc.bg, color: lc.text, border: `1px solid ${lc.text}30` }}
                >
                  {lc.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
