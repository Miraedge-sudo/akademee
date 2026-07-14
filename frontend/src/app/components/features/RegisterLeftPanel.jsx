import { useState, useEffect, useRef } from "react";
import ClayScene from "./ClayScene";

// ── Animated Counter ──
function AnimatedCounter({ end, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / 2000, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

// ── Detect dark mode ──
function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// ── Main Component ──
export default function RegisterLeftPanel() {
  const isDark = useIsDark();

  return (
    <div data-register-panel className="hidden lg:flex lg:w-[52%] flex-shrink-0 bg-white dark:bg-surface-900 relative overflow-hidden sticky top-0 h-screen transition-colors duration-200">
      {/* 3D Clay Scene */}
      <div className="absolute inset-0 z-0">
        <ClayScene isDark={isDark} />
      </div>

      {/* Overlay content */}
      <div className="relative z-20 flex flex-col h-full px-10 py-10 w-full pointer-events-none">
        {/* Logo - still clickable */}
        <div className="flex items-center gap-3 animate-fadeIn pointer-events-auto">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[16px] h-[16px] text-indigo-600 dark:text-indigo-400">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-5" />
            </svg>
          </div>
          <span className="text-base text-surface-800 dark:text-surface-100 font-semibold tracking-tight">Akademee</span>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          {/* Tagline */}
          <div className="text-center animate-fadeIn" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 leading-tight tracking-tight">
              La gestion scolaire
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                en un clic.
              </span>
            </h2>
            <p className="mt-1.5 text-sm text-surface-400 dark:text-surface-500 max-w-xs mx-auto">
              Gérez établissements, élèves et administration.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-5 animate-fadeIn" style={{ animationDelay: "0.4s" }}>
            {[
              { value: 127, suffix: "+", label: "Écoles" },
              { value: 31000, suffix: "+", label: "Élèves" },
              { value: 94, suffix: "%", label: "Gain de temps" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-bold text-surface-800 dark:text-surface-100 tabular-nums">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[11px] text-surface-400 dark:text-surface-500 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-3 animate-fadeIn pointer-events-auto" style={{ animationDelay: "0.5s" }}>
          {[
            { icon: "🔒", text: "Sécurisé" },
            { icon: "⚡", text: "Rapide" },
            { icon: "🌍", text: "Cameroon" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-50/80 dark:bg-surface-800/80 backdrop-blur-sm border border-surface-100 dark:border-surface-700">
              <span className="text-xs">{item.icon}</span>
              <span className="text-[10px] font-medium text-surface-500 dark:text-surface-400">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
