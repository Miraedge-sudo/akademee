import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/* ── Animated counter hook ── */
function useCountUp(target, decimals = 0, durationMs = 1100) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const raw = target * eased;
      setValue(decimals ? Number(raw.toFixed(decimals)) : Math.round(raw));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target, decimals, durationMs]);
  return value;
}

const KPIS = [
  { target: 540, suffix: "+", labelKey: "panel.kpiSchools" },
  { target: 62, suffix: "k", labelKey: "panel.kpiStudents" },
  { target: 99.9, suffix: "%", labelKey: "panel.kpiAvailability", decimals: 1 },
];

export default function LoginLeftPanel() {
  const { t } = useTranslation("auth");
  const [mounted, setMounted] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [barsRevealed, setBarsRevealed] = useState(false);
  const [stickerRevealed, setStickerRevealed] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Staggered reveal sequence
  useEffect(() => {
    if (!mounted) return;
    const t1 = setTimeout(() => setCardsRevealed(true), 600);
    const t2 = setTimeout(() => setBarsRevealed(true), 900);
    const t3 = setTimeout(() => setStickerRevealed(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [mounted]);

  return (
    <aside className="hidden lg:flex lg:w-[48%] flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-900 to-teal-950">
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Decorative glowing orbs */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center w-full h-full px-12 xl:px-16 py-12">
        <div className="max-w-[460px] mx-auto w-full">
          {/* Eyebrow — slide in from left */}
          <div
            className={`text-[13px] font-semibold tracking-[0.06em] uppercase text-amber-400 mb-4 transition-all duration-700 ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            {t("login.panel.eyebrow")}
          </div>

          {/* Title — slide in from left with delay */}
          <h2
            className={`font-display text-[34px] xl:text-[38px] leading-[1.1] font-medium text-white mb-3.5 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            {t("login.panel.title")}
            <span className="block text-teal-100/80">{t("login.panel.titleContinuation")}</span>
          </h2>

          {/* Subtitle — slide in from left */}
          <p
            className={`text-[15px] leading-relaxed text-white/70 max-w-[400px] mb-10 transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
            }`}
          >
            {t("login.panel.subtitle")}
          </p>

          {/* ── Dashboard Preview Frame — slides in from left then rotates ── */}
          <div
            className={`relative transition-all duration-[800ms] delay-300 ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            <div
              className="bg-[#F7FBF8] rounded-2xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] transition-transform duration-[1000ms] delay-[500ms]"
              style={{
                transform: mounted ? "rotate(-1.2deg)" : "rotate(0deg)",
              }}
            >
              {/* Chrome bar — dots slide in left to right */}
              <div className="h-[26px] bg-[#EAF1EC] flex items-center gap-[5px] px-3 border-b border-[#DCE7E0]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`w-[6px] h-[6px] rounded-full bg-[#C7D6CC] transition-all duration-500 ${
                      cardsRevealed
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-3"
                    }`}
                    style={{ transitionDelay: `${600 + i * 100}ms` }}
                  />
                ))}
              </div>

              {/* Frame body */}
              <div className="p-4">
                {/* Stats cards — slide left, up, right */}
                <div className="flex gap-2.5">
                  {[
                    { value: "1 284", label: t("login.panel.statStudents") },
                    { value: "42", label: t("login.panel.statClasses") },
                    { value: "96%", label: t("login.panel.statAttendance") },
                  ].map((stat, i) => {
                    const slideClasses = [
                      "-translate-x-6 opacity-0", // left
                      "translate-y-4 opacity-0",   // bottom
                      "translate-x-6 opacity-0",    // right
                    ];
                    const activeClasses = [
                      "translate-x-0 opacity-100",
                      "translate-y-0 opacity-100",
                      "translate-x-0 opacity-100",
                    ];
                    return (
                      <div
                        key={stat.label}
                        className={`flex-1 bg-white rounded-lg border border-[#E4EBE6] px-3 py-2.5 transition-all duration-[600ms] ${
                          cardsRevealed ? activeClasses[i] : slideClasses[i]
                        }`}
                        style={{ transitionDelay: `${i * 150}ms` }}
                      >
                        <b className="block text-[15px] text-teal-900 font-bold">{stat.value}</b>
                        <span className="text-[10px] text-surface-500 font-medium">{stat.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Mini bar chart — bars grow from bottom */}
                <div className="flex items-end gap-[5px] h-[54px] mt-2.5">
                  {[40, 65, 52, 78, 60, 85, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[3px] bg-gradient-to-b from-teal-400 to-teal-600 transition-all duration-[700ms] ease-out"
                      style={{
                        height: barsRevealed ? `${h}%` : "0%",
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Testimonial sticker — slides in from right and scales up */}
            <div
              className={`absolute -bottom-6 -right-5 bg-[#FBEBC2] text-[#5C3E05] rounded-xl px-3.5 py-3 shadow-[0_18px_30px_-14px_rgba(0,0,0,0.4)] max-w-[200px] transition-all duration-[700ms] ${
                stickerRevealed
                  ? "opacity-100 translate-x-0 scale-100 rotate-[3deg]"
                  : "opacity-0 translate-x-10 scale-90 rotate-0"
              }`}
            >
              <p className="text-[11px] leading-[1.5] font-medium">
                {t("login.panel.testimonialQuote")}
              </p>
              <span className="block mt-1.5 text-[10.5px] font-bold">
                {t("login.panel.testimonialAuthor")}
              </span>
            </div>
          </div>

          {/* ── KPI Counters — slide in from right ── */}
          <div
            className={`flex gap-8 mt-16 transition-all duration-700 delay-500 ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            {KPIS.map((k) => {
              const v = useCountUp(k.target, k.decimals || 0);
              return (
                <div key={k.labelKey}>
                  <b className="block font-display text-[26px] text-white font-medium">
                    {k.decimals ? v.toFixed(k.decimals) : v}
                    {k.suffix}
                  </b>
                  <span className="text-[11.5px] text-white/60">{t(k.labelKey)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom decorative bars */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-teal-500/30" />
        <div className="flex-1 bg-teal-400/40" />
        <div className="flex-1 bg-teal-300/40" />
        <div className="flex-1 bg-amber-400/40" />
      </div>
    </aside>
  );
}
