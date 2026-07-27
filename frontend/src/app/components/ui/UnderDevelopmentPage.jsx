/**
 * UnderDevelopmentPage — Beautiful "page under development" placeholder.
 * Shown for routes that exist in the sidebar but are not yet implemented.
 *
 * Features:
 *  - Animated construction helmet with rotating tools
 *  - Pulsing construction sign
 *  - Floating "Under Development" text
 *  - "Go back" button
 *  - Bouncing dots animation
 */
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHardDrive, FiTool } from "react-icons/fi";

export default function UnderDevelopmentPage({ pageName }) {
  const { i18n } = useTranslation("common");
  const navigate = useNavigate();
  const isFr = i18n.language === "fr";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 px-6">
      <style>{`
        @keyframes udBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-18px); }
        }
        @keyframes udSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes udSpinReverse {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes udFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25%      { transform: translateY(-8px) rotate(3deg); }
          75%      { transform: translateY(8px) rotate(-3deg); }
        }
        @keyframes udPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.05); }
        }
        @keyframes udGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.2); }
          50%      { box-shadow: 0 0 40px rgba(245,158,11,0.4); }
        }
        @keyframes udSlideUp {
          0%   { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes udToolWobble {
          0%, 100% { transform: rotate(-10deg); }
          50%      { transform: rotate(10deg); }
        }
        @keyframes udDotBounce {
          0%, 80%, 100% { transform: scale(0); }
          40%           { transform: scale(1); }
        }
        @keyframes udGridMove {
          0%   { transform: translateX(0) translateY(0); }
          100% { transform: translateX(30px) translateY(30px); }
        }
        @keyframes udBarFill {
          0%   { width: 0%; }
          100% { width: 65%; }
        }
        .ud-bounce { animation: udBounce 2s ease-in-out infinite; }
        .ud-spin { animation: udSpin 4s linear infinite; }
        .ud-spin-reverse { animation: udSpinReverse 3s linear infinite; }
        .ud-float { animation: udFloat 3s ease-in-out infinite; }
        .ud-pulse { animation: udPulse 2s ease-in-out infinite; }
        .ud-glow { animation: udGlow 2s ease-in-out infinite; }
        .ud-slide { animation: udSlideUp 0.6s cubic-bezier(.16,1,.3,1) both; }
        .ud-tool { animation: udToolWobble 2s ease-in-out infinite; }
        .ud-dot:nth-child(1) { animation: udDotBounce 1.4s ease-in-out 0s infinite both; }
        .ud-dot:nth-child(2) { animation: udDotBounce 1.4s ease-in-out 0.2s infinite both; }
        .ud-dot:nth-child(3) { animation: udDotBounce 1.4s ease-in-out 0.4s infinite both; }
      `}</style>

      {/* ── Background construction grid ── */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#F59E0B 1px, transparent 1px), linear-gradient(90deg, #F59E0B 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          animation: "udGridMove 4s linear infinite",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Animated construction icon cluster */}
        <div className="relative w-36 h-36 mb-8">
          {/* Hard hat (main icon) */}
          <div
            className="absolute inset-0 flex items-center justify-center ud-bounce"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="w-28 h-28 rounded-[32px] flex items-center justify-center ud-glow"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
                {/* Construction helmet */}
                <path d="M4 15a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1Z" />
                <path d="M8 11V6a4 4 0 0 1 4-4 4 4 0 0 1 4 4v5" />
                <path d="M12 15v5" />
                <path d="M8 20h8" />
              </svg>
            </div>
          </div>

          {/* Spinning wrench (top-right) */}
          <div
            className="absolute -top-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center ud-spin"
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <FiTool size={18} className="text-blue-500" />
          </div>

          {/* Spinning gear (bottom-left) */}
          <div
            className="absolute -bottom-3 -left-3 w-12 h-12 rounded-2xl flex items-center justify-center ud-spin-reverse"
            style={{
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>

          {/* Floating gear (top-left) */}
          <div className="absolute -top-1 -left-1 w-7 h-7 flex items-center justify-center ud-float">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
        </div>

        {/* ── Status badge ── */}
        <span
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 ud-slide"
          style={{
            background: "rgba(245,158,11,0.12)",
            color: "#D97706",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: "#F59E0B", animation: "udPulse 1.5s ease-in-out infinite" }} />
          {isFr ? "EN DÉVELOPPEMENT" : "UNDER DEVELOPMENT"}
        </span>

        {/* ── Page name ── */}
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-3 ud-slide"
          style={{ animationDelay: "0.1s" }}
        >
          {pageName || (isFr ? "Page en cours" : "Page")}
        </h1>

        {/* ── Description ── */}
        <p
          className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 ud-slide"
          style={{ animationDelay: "0.15s" }}
        >
          {isFr
            ? "Cette fonctionnalité est actuellement en cours de développement. Nous travaillons dur pour la rendre disponible très bientôt. Revenez dans quelques jours !"
            : "This feature is currently being developed. We're working hard to make it available soon. Check back in a few days!"}
        </p>

        {/* ── Progress bar ── */}
        <div
          className="w-64 mb-8 ud-slide"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: "65%",
                background: "linear-gradient(90deg, #F59E0B, #D97706)",
                animation: "udBarFill 2s ease-out forwards",
                boxShadow: "0 0 12px rgba(245,158,11,0.3)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-gray-400">
              {isFr ? "Progression" : "Progress"}
            </span>
            <span className="text-[11px] font-bold text-gray-500">65%</span>
          </div>
        </div>

        {/* ── Animated dots ── */}
        <div
          className="flex items-center gap-1 mb-8 ud-slide"
          style={{ animationDelay: "0.25s" }}
        >
          <span className="ud-dot w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
          <span className="ud-dot w-2 h-2 rounded-full" style={{ background: "#3B82F6" }} />
          <span className="ud-dot w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
        </div>

        {/* ── Back button ── */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95 ud-slide shadow-md"
          style={{
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            animationDelay: "0.3s",
          }}
        >
          <FiArrowLeft size={16} />
          {isFr ? "Retour à la page précédente" : "Go back"}
        </button>

        {/* ── Construction lines decoration ── */}
        <div
          className="flex items-center gap-2 mt-10 text-gray-300 dark:text-gray-600 ud-slide"
          style={{ animationDelay: "0.35s" }}
        >
          <FiHardDrive size={14} />
          <div className="w-12 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-[10px] font-medium uppercase tracking-widest">
            {isFr ? "Bientôt disponible" : "Coming soon"}
          </span>
          <div className="w-12 h-px bg-gray-200 dark:bg-gray-700" />
          <FiHardDrive size={14} />
        </div>
      </div>
    </div>
  );
}
