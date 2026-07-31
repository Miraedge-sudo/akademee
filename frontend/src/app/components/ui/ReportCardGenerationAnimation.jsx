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
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FiFileText, FiSettings, FiZap, FiX, FiCheckCircle } from "react-icons/fi";

const PAPER_COUNT = 12;
const PARTICLE_COUNT = 30;
const BURST_COUNT = 20;

const BURST_COLORS = [
  "#1D9E75", "#34D399", "#6EE7B7", "#A7F3D0",
  "#FCD34D", "#FBBF24", "#F59E0B", "#FDE68A",
  "#EC4899", "#F472B6", "#8B5CF6", "#A78BFA",
];

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

function generateBursts() {
  return Array.from({ length: BURST_COUNT }, (_, i) => {
    const angle = (i / BURST_COUNT) * 360;
    const distance = randomBetween(60, 160);
    const rad = (angle * Math.PI) / 180;
    return {
      id: i,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      delay: randomBetween(0, 0.3),
      duration: randomBetween(0.5, 1.2),
      size: randomBetween(4, 12),
      color: BURST_COLORS[i % BURST_COLORS.length],
      rotation: randomBetween(-180, 180),
    };
  });
}

export default function ReportCardGenerationAnimation({ visible, onFinish, onDismiss, primaryColor = "#085041", realProgress = null }) {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const [exiting, setExiting] = useState(false);
  const [exited, setExited] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const hasBeenVisible = useRef(false);
  const wasComplete = useRef(false);

  const papers = useMemo(() => generatePapers(), []);
  const particles = useMemo(() => generateParticles(), []);
  const bursts = useMemo(() => generateBursts(), []);

  // ── Detect when progress hits 100% ──
  useEffect(() => {
    if (progress >= 100 && !wasComplete.current) {
      wasComplete.current = true;
      setCompleted(true);
    }
    if (progress < 100) {
      wasComplete.current = false;
      setCompleted(false);
    }
  }, [progress]);

  const isFetchingFirstEvent = visible && realProgress === null;

  // ── Progress: only real SSE progress, NO simulated fallback ──
  useEffect(() => {
    if (!visible) {
      setProgress(0);
      setStageIndex(0);
      return;
    }

    // If real progress is provided, use it directly
    if (realProgress !== null) {
      setProgress(realProgress);

      // Find stage: make the last stage inclusive at max=100
      const currentStage = GEN_STAGES.findIndex(s => realProgress >= s.min && realProgress < s.max);
      if (currentStage >= 0) setStageIndex(currentStage);
      return;
    }

    // When visible but no realProgress yet, leave progress at 0.
    // The parent shows an indeterminate "starting..." state instead of fake progress.
    setProgress(0);
    setStageIndex(0);
  }, [visible, realProgress]);

  // ── Auto-dismiss after reaching 100% for 2 seconds ──
  useEffect(() => {
    if (!completed || !visible) return;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setExited(true);
        setExiting(false);
        setCompleted(false);
        onFinish?.();
      }, 600);
    }, 2000);
    return () => clearTimeout(timer);
  }, [completed, visible, onFinish]);

  // ── Visibility effect: show/hide with exit animation ──
  useEffect(() => {
    if (visible) {
      // Show: reset all states
      hasBeenVisible.current = true;
      setExiting(false);
      setExited(false);
      setDismissed(false);
      return;
    }
    // Hide: start exit animation
    if (!hasBeenVisible.current) return;
    setExiting(true);
    const timer = setTimeout(() => {
      setExited(true);  // ← this triggers component to return null
      setExiting(false);
      onFinish?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [visible, onFinish]);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setExited(true);
      setExiting(false);
      onDismiss?.();
    }, 400);
  }, [onDismiss]);

  // ── Darker variant for gradient ──
  const pc = primaryColor || "#085041";
  const darker = pc + "f5";

  // Never been made visible → render nothing (prevents flash on mount)
  if (!hasBeenVisible.current && !visible) return null;
  // Only return null when fully exited (after exit animation plays)
  if (exited || dismissed) return null;

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
        @keyframes genCheckPop {
          0%   { transform: scale(0); opacity: 0; }
          50%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes genCheckRing {
          0%   { transform: scale(0.8); opacity: 0; }
          50%  { opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes genBurstFly {
          0%   { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 1; }
          20%  { opacity: 1; }
          100% { transform: translate(var(--bx, 100px), var(--by, 100px)) scale(1) rotate(var(--br, 180deg)); opacity: 0; }
        }
        @keyframes genConfettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
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

        {/* ── Central icon cluster ── */}
        <div className="relative w-32 h-32 mb-8">
          {!completed ? (
            /* ── Spinning gears (generating state) ── */
            <>
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
            </>
          ) : (
            /* ── Success checkmark (completed state) ── */
            <>
              {/* Expanding rings */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ animation: "genCheckRing 0.8s cubic-bezier(.16,1,.3,1) 0.2s both" }}
              >
                <div
                  className="w-32 h-32 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${pc}40 0%, transparent 70%)`,
                  }}
                />
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ animation: "genCheckRing 0.8s cubic-bezier(.16,1,.3,1) 0.5s both" }}
              >
                <div
                  className="w-40 h-40 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${pc}20 0%, transparent 70%)`,
                  }}
                />
              </div>

              {/* Burst particles */}
              {bursts.map((b) => (
                <div
                  key={b.id}
                  className="absolute top-1/2 left-1/2 -ml-1 -mt-1 pointer-events-none"
                  style={{
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    borderRadius: b.id % 3 === 0 ? '50%' : b.id % 3 === 1 ? '2px' : '0',
                    background: b.color,
                    ["--bx"]: `${b.x}px`,
                    ["--by"]: `${b.y}px`,
                    ["--br"]: `${b.rotation}deg`,
                    animation: `genBurstFly ${b.duration}s cubic-bezier(.25,.46,.45,.94) ${b.delay}s both`,
                    boxShadow: `0 0 6px ${b.color}80`,
                  }}
                />
              ))}

              {/* Checkmark circle */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ animation: "genCheckPop 0.6s cubic-bezier(.16,1,.3,1) 0.1s both" }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, #1D9E75, #34D399)`,
                    boxShadow: `0 0 40px rgba(29,158,117,0.5), 0 0 80px rgba(29,158,117,0.2)`,
                  }}
                >
                  <FiCheckCircle size={48} className="text-white" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Progress bar with percentage (or indeterminate pulsing) ── */}
        <div className="w-72 mb-4">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${isFetchingFirstEvent ? 'animate-pulse' : ''}`}
              style={{
                width: isFetchingFirstEvent ? '100%' : `${progress}%`,
                background: isFetchingFirstEvent
                  ? `linear-gradient(90deg, ${pc}60, ${pc}, ${pc}60)`
                  : `linear-gradient(90deg, ${pc}, #fff)`,
                boxShadow: isFetchingFirstEvent
                  ? `0 0 12px ${pc}40`
                  : `0 0 12px ${pc}80`,
                backgroundSize: isFetchingFirstEvent ? '200% 100%' : undefined,
                animation: isFetchingFirstEvent ? 'genTextShimmer 1.5s linear infinite' : undefined,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-white/50">
              {isFetchingFirstEvent
                ? (isFr ? 'Démarrage...' : 'Starting...')
                : stageLabel
              }
            </span>
            <span className="text-[11px] text-white/70 font-bold tabular-nums">
              {isFetchingFirstEvent ? '--' : `${progress}%`}
            </span>
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-extrabold mb-1 tracking-wide"
          style={{
            color: completed ? '#34D399' : '#fff',
            animation: completed ? 'none' : 'genPulse 2s ease-in-out infinite',
            textShadow: completed
              ? '0 0 40px rgba(52,211,153,0.3)'
              : '0 0 40px rgba(255,255,255,0.15)',
            transition: 'color 0.5s ease-out, text-shadow 0.5s ease-out',
          }}
        >
          {completed
            ? (isFr ? '✓ Génération terminée !' : '✓ Generation Complete!')
            : (isFr ? 'Génération des bulletins' : 'Generating Report Cards')
          }
        </h2>

        {/* Current stage or success message */}
        {completed ? (
          <p
            className="text-sm font-medium mb-6 text-white/70"
            style={{
              animation: 'genScaleIn 0.5s cubic-bezier(.16,1,.3,1) 0.3s both',
            }}
          >
            {isFr
              ? 'Tous les bulletins ont été générés avec succès !'
              : 'All report cards have been generated successfully!'
            }
          </p>
        ) : (
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
        )}

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
