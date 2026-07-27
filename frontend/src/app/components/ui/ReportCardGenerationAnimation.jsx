/**
 * ReportCardGenerationAnimation — Spectacular full-screen animation overlay
 * shown while report cards are being generated.
 *
 * Props:
 *  - visible: boolean — show/hide the overlay
 *  - primaryColor: string — school's primary color (from onboarding)
 *  - onFinish: function — called after exit animation completes
 *  - onDismiss: function — called when user manually closes the overlay
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiFileText, FiSettings, FiZap, FiX } from "react-icons/fi";

const PAPER_COUNT = 12;
const PARTICLE_COUNT = 30;

const PARTICLE_COLORS = [
  "#1D9E75", "#3B82F6", "#F59E0B", "#8B5CF6",
  "#EF4444", "#EC4899", "#14B8A6", "#6366F1",
];

const GEN_STAGES = [
  { key: "init",    min: 0,  max: 15,  fr: "Initialisation...",               en: "Initializing..." },
  { key: "subjects",min: 15, max: 40,  fr: "Calcul des moyennes par matière...", en: "Calculating subject averages..." },
  { key: "rankings",min: 40, max: 65,  fr: "Calcul des classements...",        en: "Computing rankings..." },
  { key: "mentions",min: 65, max: 85,  fr: "Application des mentions...",      en: "Applying mention thresholds..." },
  { key: "final",   min: 85, max: 100, fr: "Finalisation du bulletin...",      en: "Finalizing report card..." },
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generatePapers() {
  return Array.from({ length: PAPER_COUNT }, (_, i) => ({
    id: i,
    left: randomBetween(5, 90),
    delay: randomBetween(0, 2.5),
    duration: randomBetween(3, 6),
    rotation: randomBetween(-30, 30),
    size: randomBetween(40, 90),
    drift: randomBetween(-120, 120),
  }));
}

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: randomBetween(0, 100),
    delay: randomBetween(0, 3),
    duration: randomBetween(2, 5),
    size: randomBetween(3, 8),
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  }));
}

export default function ReportCardGenerationAnimation({ visible, onFinish, onDismiss, primaryColor = "#085041" }) {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const [exiting, setExiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const hasBeenVisible = useRef(false);

  const papers = useMemo(() => generatePapers(), []);
  const particles = useMemo(() => generateParticles(), []);

  // ── Simulated realistic progress ──
  useEffect(() => {
    if (!visible) {
      setProgress(0);
      setStageIndex(0);
      return;
    }

    const totalDuration = 4000; // 4 seconds to go from 0 to ~95%
    const interval = 120; // update every 120ms
    const steps = totalDuration / interval;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const rawPct = Math.min((step / steps) * 100, 95);
      // Use an easing curve for more realistic progress
      const eased = 1 - Math.pow(1 - rawPct / 100, 2);
      const pct = Math.round(eased * 100);
      setProgress(pct);

      // Determine stage
      const currentStage = GEN_STAGES.findIndex(s => pct >= s.min && pct < s.max);
      if (currentStage >= 0) setStageIndex(currentStage);
    }, interval);

    return () => clearInterval(timer);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      hasBeenVisible.current = true;
      setExiting(false);
      setDismissed(false);
      return;
    }
    if (!hasBeenVisible.current) return;
    setExiting(true);
    const timer = setTimeout(() => {
      setExiting(false);
      onFinish?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [visible, onFinish]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // ── Darker variant for gradient ──
  const pc = primaryColor || "#085041";
  const darker = pc + "f5";

  if ((!visible && !exiting) || dismissed) return null;

  const currentStage = GEN_STAGES[stageIndex] || GEN_STAGES[GEN_STAGES.length - 1];
  const stageLabel = isFr ? currentStage.fr : currentStage.en;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: exiting
          ? "rgba(0,0,0,0)"
          : `radial-gradient(ellipse at center, ${pc}eb 0%, ${darker} 100%)`,
        transition: "background 0.6s cubic-bezier(.16,1,.3,1)",
      }}
    >
      <style>{`
        @keyframes genPaperFloat {
          0%   { transform: translateY(100vh) rotate(0deg) scale(0.6); opacity: 0; }
          10%  { opacity: 1; }
          60%  { opacity: 0.8; }
          100% { transform: translateY(-120vh) scale(1.1); opacity: 0; }
        }
        @keyframes genGearSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes genGearSpinReverse {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes genParticleFloat {
          0%   { transform: translateY(0) scale(0); opacity: 0; }
          20%  { opacity: 1; transform: scale(1); }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        @keyframes genPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.08); opacity: 1; }
        }
        @keyframes genTextShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes genScaleIn {
          0%   { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes genPulseRing {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes genOrbit {
          0%   { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }
        @keyframes genOrbitReverse {
          0%   { transform: rotate(0deg) translateX(90px) rotate(0deg); }
          100% { transform: rotate(-360deg) translateX(90px) rotate(360deg); }
        }
        @keyframes genProgressActive {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        .gen-paper {
          position: absolute;
          pointer-events: none;
          animation:
            genPaperFloat var(--paper-duration, 5s) cubic-bezier(.25,.46,.45,.94) var(--paper-delay, 0s) infinite;
        }
        .gen-particle {
          position: absolute;
          bottom: -10px;
          border-radius: 50%;
          pointer-events: none;
          animation: genParticleFloat var(--particle-duration, 3s) ease-out var(--particle-delay, 0s) infinite;
        }
        .gen-ring {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          animation: genPulseRing 2.5s cubic-bezier(.16,1,.3,1) infinite;
        }
        .gen-ring:nth-child(2) { animation-delay: 0.8s; }
        .gen-ring:nth-child(3) { animation-delay: 1.6s; }
      `}</style>

      {/* ── Close button ── */}
      {visible && (
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 z-20 w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title={isFr ? "Fermer (la génération continue)" : "Close (generation continues)"}
        >
          <FiX size={20} />
        </button>
      )}

      {/* ── Flying papers ── */}
      {papers.map((p, i) => (
        <div
          key={p.id}
          className="gen-paper"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.3}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--paper-duration"]: `${p.duration}s`,
            ["--paper-delay"]: `${p.delay}s`,
          }}
        >
          <div
            className="w-full h-full rounded-lg flex items-center justify-center shadow-lg"
            style={{
              background: i % 2 === 0
                ? "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))"
                : `linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))`,
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.1)",
              transform: `rotate(${p.rotation}deg)`,
            }}
          >
            <FiFileText
              size={p.size * 0.35}
              style={{
                color: i % 2 === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)",
              }}
            />
          </div>
        </div>
      ))}

      {/* ── Particles ── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="gen-particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}60`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--particle-duration"]: `${p.duration}s`,
            ["--particle-delay"]: `${p.delay}s`,
          }}
        />
      ))}

      {/* ── Central content ── */}
      <div
        style={{
          animation: exiting
            ? "none"
            : "genScaleIn 0.6s cubic-bezier(.16,1,.3,1) 0.2s both",
          opacity: exiting ? 0 : 1,
          transition: "opacity 0.4s ease-out",
        }}
        className="relative flex flex-col items-center z-10"
      >
        {/* Pulsing rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="gen-ring" />
          <div className="gen-ring" />
          <div className="gen-ring" />
        </div>

        {/* Central icon cluster */}
        <div className="relative w-32 h-32 mb-8">
          <div
            className="absolute top-1/2 left-1/2 w-6 h-6 -ml-3 -mt-3"
            style={{ animation: "genOrbit 3s linear infinite" }}
          >
            <FiFileText size={18} className="text-white/60" />
          </div>
          <div
            className="absolute top-1/2 left-1/2 w-5 h-5 -ml-2.5 -mt-2.5"
            style={{ animation: "genOrbitReverse 4s linear infinite" }}
          >
            <FiZap size={14} className="text-yellow-300/70" />
          </div>
          <div
            className="absolute top-1/2 left-1/2 w-5 h-5 -ml-2.5 -mt-2.5"
            style={{ animation: "genOrbit 2.5s linear infinite", animationDelay: "-1s" }}
          >
            <FiFileText size={14} className="text-white/40" />
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: "genPulse 2s ease-in-out infinite" }}
          >
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center backdrop-blur-md"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="relative">
                <FiSettings
                  size={40}
                  className="text-white/90"
                  style={{
                    animation: "genGearSpin 4s linear infinite",
                    filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
                  }}
                />
                <FiSettings
                  size={18}
                  className="text-white/50 absolute -top-1 -right-3"
                  style={{ animation: "genGearSpinReverse 2.5s linear infinite" }}
                />
                <FiSettings
                  size={12}
                  className="text-white/40 absolute -bottom-1 -left-2"
                  style={{ animation: "genGearSpin 3s linear infinite" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Real progress bar with percentage ── */}
        <div className="w-72 mb-4">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${pc}, #fff)`,
                boxShadow: `0 0 12px ${pc}80`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-white/50">{stageLabel}</span>
            <span className="text-[11px] text-white/70 font-bold tabular-nums">{progress}%</span>
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-extrabold text-white mb-1 tracking-wide"
          style={{
            animation: "genPulse 2s ease-in-out infinite",
            textShadow: "0 0 40px rgba(255,255,255,0.15)",
          }}
        >
          {isFr ? "Génération des bulletins" : "Generating Report Cards"}
        </h2>

        {/* Current stage */}
        <p
          className="text-sm font-medium mb-6"
          style={{
            background: "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.9), rgba(255,255,255,0.5))",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "genTextShimmer 2s linear infinite",
          }}
        >
          {stageLabel}
        </p>

        {/* Dismiss hint */}
        {visible && (
          <p
            className="text-[11px] text-white/30 mt-2 cursor-pointer hover:text-white/50 transition-colors"
            onClick={handleDismiss}
          >
            {isFr ? "Cliquez ici ou appuyez sur Échap pour fermer" : "Click here or press Escape to close"}
          </p>
        )}
      </div>

      {/* Exit overlay fade */}
      {exiting && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.6) 100%)",
            animation: "genScaleIn 0.5s ease-out forwards",
          }}
        />
      )}
    </div>
  );
}
