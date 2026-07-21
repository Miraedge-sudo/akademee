import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FiBarChart2, FiEdit3, FiCheckCircle, FiDollarSign, FiCrosshair } from "react-icons/fi";

const SLIDES = [
  {
    key: "dashboard",
    label: "Vue d'ensemble",
    titleKey: "panel.slideDashboardTitle",
    descKey: "panel.slideDashboardDesc",
  },
  {
    key: "grades",
    label: "Notes & bulletins",
    iconName: "edit",
    titleKey: "panel.slideGradesTitle",
    descKey: "panel.slideGradesDesc",
  },
  {
    key: "attendance",
    label: "Présence",
    iconName: "check",
    titleKey: "panel.slideAttendanceTitle",
    descKey: "panel.slideAttendanceDesc",
  },
  {
    key: "finance",
    label: "Frais scolaires",
    iconName: "dollar",
    titleKey: "panel.slideFinanceTitle",
    descKey: "panel.slideFinanceDesc",
  },
];

const SLIDER_ANIMATION_DURATION = 500;

export default function RegisterLeftPanel() {
  const { t } = useTranslation("auth");
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [illuRevealed, setIlluRevealed] = useState(false);
  const timer = useRef(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    timer.current = setInterval(() => {
      if (animatingRef.current) return;
      setActive((a) => (a + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer.current);
  }, []);

  function goTo(i) {
    if (animating || i === active) return;
    animatingRef.current = true;
    setAnimating(true);
    setActive(i);
    clearInterval(timer.current);
    // Reset animating after transition completes
    setTimeout(() => {
      animatingRef.current = false;
      setAnimating(false);
    }, SLIDER_ANIMATION_DURATION);
    timer.current = setInterval(
      () => {
        if (animatingRef.current) return;
        setActive((a) => (a + 1) % SLIDES.length);
      },
      5000
    );
  }

  // Trigger mini‑illustration animations after the slide transition
  useEffect(() => {
    setIlluRevealed(false);
    const t = setTimeout(() => setIlluRevealed(true), SLIDER_ANIMATION_DURATION + 80);
    return () => clearTimeout(t);
  }, [active]);

  const containerOffset = -active * 100;

  return (
    <aside className="hidden lg:flex lg:w-[46%] xl:w-[48%] flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-900 to-teal-950">
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Decorative glowing orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center w-full h-full px-12 xl:px-16 py-12">
        <div className="max-w-[480px] mx-auto w-full">
          {/* Eyebrow */}
          <div
            className={`text-[13px] font-semibold tracking-[0.06em] uppercase text-amber-400 mb-4 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {t("register.panel.eyebrow")}
          </div>

          {/* Title */}
          <h2
            className={`font-display text-[32px] xl:text-[36px] leading-[1.1] font-medium text-white mb-3.5 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {t("register.panel.title")}
            <span className="block text-teal-100/80">{t("register.panel.titleContinuation")}</span>
          </h2>

          {/* Subtitle */}
          <p
            className={`text-[15px] leading-relaxed text-white/70 max-w-[420px] mb-10 transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {t("register.panel.subtitle")}
          </p>

          {/* ── Feature Card (auto-rotating) ── */}
          <div
            className={`relative transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="bg-[#F7FBF8] rounded-2xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
              {/* Chrome bar */}
              <div className="h-[28px] bg-[#EAF1EC] flex items-center gap-[5px] px-3 border-b border-[#DCE7E0]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#C7D6CC]" />
                <span className="w-[6px] h-[6px] rounded-full bg-[#C7D6CC]" />
                <span className="w-[6px] h-[6px] rounded-full bg-[#C7D6CC]" />
              </div>

              {/* Slider container — slides left/right based on direction */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform ease-[cubic-bezier(0.65,0,0.35,1)]"
                  style={{
                    transform: `translateX(${containerOffset}%)`,
                    transitionDuration: `${SLIDER_ANIMATION_DURATION}ms`,
                  }}
                >
                  {SLIDES.map((s) => (
                    <div key={s.key} className="w-full flex-shrink-0 p-5 min-h-[180px] flex items-start gap-4">
                      {/* Emoji/icon */}
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                        {s.key === "dashboard" && <FiBarChart2 className="w-6 h-6 text-teal-700" />}
                        {s.key === "grades" && <FiEdit3 className="w-6 h-6 text-teal-700" />}
                        {s.key === "attendance" && <FiCheckCircle className="w-6 h-6 text-teal-700" />}
                        {s.key === "finance" && <FiDollarSign className="w-6 h-6 text-teal-700" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg font-medium text-teal-900 mb-1.5">
                          {t("register." + s.titleKey)}
                        </h3>
                        <p className="text-[13.5px] leading-relaxed text-surface-500">
                          {t("register." + s.descKey)}
                        </p>

                        {/* Mini illustration per slide — micro‑animated */}
                        <div className="mt-4">
                          {s.key === "dashboard" && (
                            <div className="flex gap-2">
                              {[
                                { value: "1 284", label: t("register.panel.miniStatStudents") },
                                { value: "42", label: t("register.panel.miniStatClasses") },
                                { value: "96%", label: t("register.panel.miniStatAttendance") },
                              ].map((stat, i) => (
                                <div
                                  key={stat.value}
                                  className={`flex-1 bg-white rounded-lg border border-[#E4EBE6] px-2.5 py-2 text-center transition-all duration-[400ms] ease-out ${
                                    illuRevealed
                                      ? "opacity-100 translate-y-0 scale-100"
                                      : "opacity-0 translate-y-3 scale-95"
                                  }`}
                                  style={{ transitionDelay: `${i * 120}ms` }}
                                >
                                  <b className="block text-[13px] text-teal-900 font-bold">
                                    {stat.value}
                                  </b>
                                  <span className="text-[9px] text-surface-500">
                                    {stat.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {s.key === "grades" && (
                            <div className="flex gap-1.5">
                              {["16/20", "13/20", "17.5/20", "12/20"].map(
                                (note, i) => (
                                  <div
                                    key={i}
                                    className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-bold transition-all duration-[400ms] ease-out ${
                                      illuRevealed
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 translate-y-2"
                                    } ${
                                      i % 2 === 0
                                        ? "bg-green-100 text-green-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                    style={{ transitionDelay: `${i * 100}ms` }}
                                  >
                                    {note}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                          {s.key === "attendance" && (
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: 28 }).map((_, i) => {
                                const isAbsent = [0, 3, 9, 17].includes(i);
                                const shade = isAbsent ? "#F3D9A0" : "#CDEBD8";
                                return (
                                  <div
                                    key={i}
                                    className={`aspect-square rounded-[3px] transition-all duration-[500ms] ease-out ${
                                      illuRevealed
                                        ? "opacity-100 scale-100"
                                        : "opacity-0 scale-0"
                                    }`}
                                    style={{
                                      background: shade,
                                      transitionDelay: `${i * 25}ms`,
                                    }}
                                  />
                                );
                              })}
                            </div>
                          )}
                          {s.key === "finance" && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-[#E4EBE6] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-700 transition-all duration-[700ms] ease-out"
                                  style={{
                                    width: illuRevealed ? "72%" : "0%",
                                    transitionDelay: "100ms",
                                  }}
                                />
                              </div>
                              <span
                                className={`text-[11px] font-semibold text-teal-700 transition-all duration-[400ms] ${
                                  illuRevealed
                                    ? "opacity-100 translate-x-0"
                                    : "opacity-0 translate-x-2"
                                }`}
                                style={{ transitionDelay: "300ms" }}
                              >
                                {t("register.panel.miniFinanceLabel")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-3 -right-3 bg-white rounded-xl px-3 py-2 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.3)] flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-[11px]">
                <FiCrosshair className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div>
                <b className="block text-[12px] text-teal-900 font-bold">
                  +128
                </b>
                <span className="text-[9.5px] text-surface-500">
                  {t("register.panel.badgeNewEnrollments")}
                </span>
              </div>
            </div>
          </div>

          {/* ── Navigation Dots ── */}
          <div
            className={`flex items-center gap-2.5 mt-8 transition-all duration-700 delay-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                className={`h-1 rounded-full border-none cursor-pointer transition-all duration-300 ${
                  i === active
                    ? "w-8 bg-amber-400"
                    : "w-5 bg-white/25 hover:bg-white/40"
                }`}
                aria-label={s.label}
                onClick={() => goTo(i)}
              />
            ))}
            <span className="ml-auto text-[11px] text-white/40 font-medium">
              {active + 1} / {SLIDES.length}
            </span>
          </div>

          {/* Features list */}
          <div
            className={`flex flex-wrap gap-x-6 gap-y-2 mt-8 transition-all duration-700 delay-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              { icon: "✓", key: "featureMultiClasses" },
              { icon: "✓", key: "featureBulletins" },
              { icon: "✓", key: "featurePayments" },
            ].map((feat) => (
              <div key={feat.key} className="flex items-center gap-2">
                <span className="text-[11px] w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center flex-shrink-0 font-bold">
                  {feat.icon}
                </span>
                <span className="text-[12.5px] text-white/70">{t("register.panel." + feat.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom decorative bars */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-teal-500/30" />
        <div className="flex-1 bg-teal-400/40" />
        <div className="flex-1 bg-teal-300/50" />
        <div className="flex-1 bg-amber-400/40" />
      </div>
    </aside>
  );
}
