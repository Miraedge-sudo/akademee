import { useState, useEffect } from "react";

/**
 * Tracks scroll progress (0–1) and whether the page is scrolled past a threshold.
 */
export function useScrollProgress(threshold = 100) {
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setProgress(pct);
      setShowBackToTop(scrollTop > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { progress, showBackToTop };
}

/**
 * Scroll progress bar — thin coloured line across the top of the viewport.
 * Pass the primaryColor and the progress value (0–1).
 */
export function ScrollProgressBar({ progress = 0, color = "#085041" }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <div
        className="h-full transition-all duration-100 ease-out"
        style={{
          width: `${progress * 100}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}

/**
 * Back-to-top floating button. Appears when showBackToTop is true.
 * Clicking scrolls smoothly to the top.
 */
export function BackToTopButton({
  show = false,
  color = "#085041",
  variant = "dark",
}) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bg =
    variant === "dark"
      ? "rgba(255,255,255,0.08)"
      : variant === "premium"
        ? "#fcfaf7"
        : "#fff";

  const border =
    variant === "dark"
      ? "rgba(255,255,255,0.12)"
      : variant === "premium"
        ? "#e8e4de"
        : "#e0ddd8";

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 w-11 h-11 flex items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all duration-500 border cursor-pointer"
      style={{
        background: bg,
        borderColor: border,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
        pointerEvents: show ? "auto" : "none",
        color: variant === "dark" ? "#fff" : "#1a1a1a",
        borderRadius: variant === "premium" ? "2px" : "9999px",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}15`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg; }}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
