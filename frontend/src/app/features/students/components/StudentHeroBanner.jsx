/**
 * StudentHeroBanner — Welcome banner with student details, status, and animated average ring.
 */
import { useEffect, useRef } from 'react';

// ── Lighten a hex color by a percentage (0–1) ──
function lighten(hex, amount) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#085041');
  if (!r) return '#085041';
  const mix = (c) => Math.min(255, Math.round(parseInt(c, 16) + (255 - parseInt(c, 16)) * amount));
  return `#${[1,2,3].map(i => mix(r[i]).toString(16).padStart(2, '0')).join('')}`;
}

// ── Darken a hex color by a percentage (0–1) ──
function darken(hex, amount) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#085041');
  if (!r) return '#085041';
  const mix = (c) => Math.max(0, Math.round(parseInt(c, 16) * (1 - amount)));
  return `#${[1,2,3].map(i => mix(r[i]).toString(16).padStart(2, '0')).join('')}`;
}

export default function StudentHeroBanner({
  name = 'Student',
  className = '',
  matricule = '',
  status = 'Active',
  rank = '-',
  totalStudents = 0,
  annualAvg = 0,
  primaryColor = '#085041',
}) {
  const arcRef = useRef(null);
  const pct = annualAvg > 0 ? annualAvg / 20 : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (arcRef.current) {
        const circumference = 283;
        arcRef.current.style.setProperty('--target', circumference * (1 - pct));
        arcRef.current.style.animation = 'studentDrawLine 1.5s cubic-bezier(.16,1,.3,1) forwards';
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <>
      <style>{`
        @keyframes studentGradientShift { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
        @keyframes studentDrawLine { from { stroke-dashoffset: var(--full) } to { stroke-dashoffset: var(--target) } }
        .student-hero-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
      <div
        className="rounded-2xl p-7 lg:p-8 mb-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${darken(primaryColor, 0.15)} 0%, ${primaryColor} 50%, ${lighten(primaryColor, 0.2)} 100%)`,
          backgroundSize: '200% 200%',
          animation: 'studentGradientShift 8s ease infinite, fadeUp 0.6s cubic-bezier(.16,1,.3,1) both',
        }}
      >
        <div className="student-hero-pattern absolute inset-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left info */}
          <div>
            <div className="text-[11px] font-semibold tracking-[2px] uppercase text-white/60 mb-1.5">
              Student portal · {new Date().getFullYear() - 1} – {new Date().getFullYear()}
            </div>
            <h1 className="font-display text-[clamp(22px,3.5vw,36px)] font-bold text-white leading-tight mb-2">
              Welcome back, {name}
            </h1>
            <div className="text-[13.5px] text-white/65 flex flex-wrap items-center gap-3">
              {className && <span>{className}</span>}
              {className && matricule && <span className="w-px h-3.5 bg-white/25" />}
              {matricule && <span>Matricule: {matricule}</span>}
              {(className || matricule) && status && <span className="w-px h-3.5 bg-white/25" />}
              {status && (
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-teal-400' : 'bg-amber-400'}`} />
                  {status}
                </span>
              )}
            </div>
          </div>

          {/* Right stats */}
          {annualAvg > 0 && (
            <div className="hidden sm:flex items-center gap-6">
              <div className="relative w-[110px] h-[110px]">
                <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
                  <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" />
                  <circle
                    ref={arcRef}
                    cx="55" cy="55" r="45"
                    fill="none"
                    stroke="rgba(255,255,255,.85)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset="283"
                    style={{ '--full': 283, '--target': 283 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-display text-[26px] font-bold text-white leading-none">
                    {annualAvg}
                  </div>
                  <div className="text-[9px] font-semibold tracking-[1px] uppercase text-white/50 mt-0.5">
                    Annual avg
                  </div>
                </div>
              </div>

              {totalStudents > 0 && (
                <div className="text-right">
                  <div className="text-[11px] font-semibold tracking-[1px] uppercase text-white/50 mb-0.5">
                    Class rank
                  </div>
                  <div className="font-display text-[22px] font-bold text-white">
                    {rank}
                    <sup className="text-sm font-normal opacity-70">
                      {rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'}
                    </sup>
                    <span className="text-[14px] font-normal opacity-70 ml-1">
                      / {totalStudents}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
