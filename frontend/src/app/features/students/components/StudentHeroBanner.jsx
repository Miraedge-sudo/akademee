/**
 * StudentHeroBanner — Welcome banner with student details, status, and animated average ring.
 */
import { useEffect, useRef } from 'react';

export default function StudentHeroBanner({
  name = 'Emma',
  className = 'Form 4A',
  matricule = 'STU-2024-0142',
  status = 'Active',
  rank = 3,
  totalStudents = 45,
  annualAvg = 14.2,
}) {
  const arcRef = useRef(null);
  const pct = annualAvg / 20;

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
        .student-hero-bg {
          background: linear-gradient(135deg, var(--teal-900, #085041) 0%, #0F6E56 50%, var(--teal-600, #1D9E75) 100%);
          background-size: 200% 200%;
          animation: studentGradientShift 8s ease infinite, fadeUp .6s cubic-bezier(.16,1,.3,1) both;
        }
        .student-hero-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
      <div className="student-hero-bg rounded-2xl p-7 lg:p-8 mb-6 relative overflow-hidden">
        <div className="student-hero-pattern absolute inset-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left info */}
          <div>
            <div className="text-[11px] font-semibold tracking-[2px] uppercase text-white/60 mb-1.5">
              Student portal · 2024 – 2025
            </div>
            <h1 className="font-display text-[clamp(22px,3.5vw,36px)] font-bold text-white leading-tight mb-2">
              Welcome back, {name}
            </h1>
            <div className="text-[13.5px] text-white/65 flex flex-wrap items-center gap-3">
              <span>{className}</span>
              <span className="w-px h-3.5 bg-white/25" />
              <span>Matricule: {matricule}</span>
              <span className="w-px h-3.5 bg-white/25" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                {status}
              </span>
            </div>
          </div>

          {/* Right stats */}
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
          </div>
        </div>
      </div>
    </>
  );
}
