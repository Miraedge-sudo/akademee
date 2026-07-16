import { useState, useEffect } from "react";
import { FiCalendar, FiChevronRight, FiBell, FiAlertCircle, FiInfo, FiExternalLink } from "react-icons/fi";
import { getPublicAnnouncements } from "../../../core/api/announcementService";

/**
 * Public announcements section for website templates.
 * Displays published announcements with priority badges, dates, and expandable content.
 * No dismiss functionality — all announcements are visible to visitors.
 */
export default function WebsiteAnnouncements({ school, variant = "bold", primaryColor = "#085041", t, TRANSLATIONS, theme }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const isDark = theme?.isDark || false;

  const revealAttr = variant === "premium" ? "data-reveal-pr" : variant === "playful" ? "data-reveal-p" : null;

  useEffect(() => {
    if (!school?.subdomain) {
      setLoading(false);
      return;
    }
    getPublicAnnouncements(school.subdomain)
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [school?.subdomain]);

  if (loading || announcements.length === 0) return null;

  // ── Priority config ──
  const PRIORITY_CONFIG = {
    high: {
      dot: "#ef4444",
      ring: "#fecaca",
      bg: "from-red-50 to-red-50/30",
      text: "#dc2626",
      label: t?.(TRANSLATIONS?.announcements?.important || { en: "Important", fr: "Important" }) || "Important",
      icon: FiAlertCircle,
    },
    low: {
      dot: "#22c55e",
      ring: "#bbf7d0",
      bg: "from-emerald-50 to-emerald-50/30",
      text: "#16a34a",
      label: t?.(TRANSLATIONS?.announcements?.info || { en: "Info", fr: "Info" }) || "Info",
      icon: FiInfo,
    },
    normal: {
      dot: "#3b82f6",
      ring: "#bfdbfe",
      bg: "from-blue-50 to-blue-50/30",
      text: "#2563eb",
      label: t?.(TRANSLATIONS?.announcements?.general || { en: "General", fr: "Général" }) || "General",
      icon: FiBell,
    },
  };

  const getPriority = (p) => PRIORITY_CONFIG[p] || PRIORITY_CONFIG.normal;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isLight = (hex) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const luminance = 0.2126 * (r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4))
                   + 0.7152 * (g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4))
                   + 0.0722 * (b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4));
    return luminance > 0.179;
  };

  // ── Variant base styles ──
  const sectionBg = variant === "playful"
    ? isDark ? "bg-[#1e1e1e]" : "bg-gradient-to-b from-white via-[#f8f7f4] to-white"
    : variant === "premium"
    ? isDark ? "bg-[#1e1e1e]" : "bg-[#faf8f5]"
    : isDark ? "bg-[#0a0a0a]" : "bg-[#f8f8f5]";

  const cardBorder = variant === "playful"
    ? isDark ? "border-[#3a3a3a] hover:border-[#555]" : "border-[#e8e4de] hover:border-[#d4cfc5]"
    : variant === "premium"
    ? isDark ? "border-[#444] hover:border-[#555]" : "border-[#e0dbd3] hover:border-[#c9c1b5]"
    : isDark ? "border-[#222] hover:border-[#333]" : "border-[#e8e4de] hover:border-[#d0cbc4]";

  const cardBg = variant === "playful"
    ? isDark ? "bg-[#2a2a2a]" : "bg-white"
    : variant === "premium"
    ? isDark ? "bg-[#252525]" : "bg-[#fdfcfa]"
    : isDark ? "bg-[#111]" : "bg-white";

  const titleCls = isDark ? "text-white" : variant === "premium" ? "text-[#2d2a24] font-serif" : "text-[#1a1a18]";
  const metaCls = isDark ? "text-[#666]" : variant === "premium" ? "text-[#9a948a]" : "text-[#8a857c]";
  const bodyCls = isDark ? "text-[#999]" : variant === "premium" ? "text-[#7a746a]" : "text-[#5a554c]";

  const br = variant === "playful" ? "16px" : variant === "premium" ? "4px" : "12px";

  return (
    <section className={`py-20 md:py-28 ${sectionBg} relative overflow-hidden`} id="announcements">
      {/* Subtle background decoration */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }}
      />

      <div className="max-w-[1200px] mx-auto px-6 md:px-8 relative z-10">
        {/* ── Section header ── */}
        <div className="text-center mb-14 md:mb-18">
          <span
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[3px] uppercase mb-4 px-4 py-1.5 rounded-full"
            style={{
              color: primaryColor,
              backgroundColor: `${primaryColor}0c`,
            }}
          >
            <FiBell className="w-3.5 h-3.5" />
            {t?.(TRANSLATIONS?.announcements?.title || { en: "Announcements", fr: "Annonces" }) || "Announcements"}
          </span>
          <h2 className={`font-bold leading-[1.15] text-[clamp(26px,4vw,44px)] ${titleCls}`}>
            {t?.(TRANSLATIONS?.announcements?.latest || { en: "Latest News & Updates", fr: "Dernières nouvelles & actualités" }) || "Latest News & Updates"}
          </h2>
          {variant === "premium" && (
            <div className="w-14 h-0.5 mx-auto mt-5 rounded-full" style={{ background: primaryColor }} />
          )}
          <p className={`text-[14px] md:text-[15px] max-w-[520px] mx-auto mt-4 leading-relaxed ${metaCls}`}>
            {t?.(TRANSLATIONS?.announcements?.subtitle || { en: "Stay informed with the latest school announcements.", fr: "Restez informé des dernières actualités de l'école." }) || "Stay informed with the latest school announcements."}
          </p>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {announcements.slice(0, 6).map((ann, i) => {
            const p = getPriority(ann.priority);
            const Icon = p.icon;
            const isExpanded = expanded === ann.id;
            const textOnPrimary = isLight(primaryColor) ? "#1a1a18" : "#ffffff";

            return (
              <div
                key={ann.id}
                className={`group relative ${cardBg} border ${cardBorder} transition-all duration-300 hover:-translate-y-1`}
                style={{ borderRadius: br, overflow: "hidden" }}
              >
                {/* Top accent bar with gradient matching priority */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${p.dot}, ${p.dot}66)`,
                  }}
                />

                <div className="p-6 pt-6 flex flex-col h-full">
                  {/* Header row: priority badge + date */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${p.dot}14`,
                        color: p.text,
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      {p.label}
                    </span>
                    {ann.publishedAt && (
                      <time className={`flex items-center gap-1 text-[11px] font-medium whitespace-nowrap ${metaCls}`}>
                        <FiCalendar className="w-3 h-3" />
                        {formatDate(ann.publishedAt)}
                      </time>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className={`font-semibold text-[15px] md:text-[16px] mb-3 leading-snug ${titleCls}`}>
                    {ann.title}
                  </h3>

                  {/* Content — expandable */}
                  <div className={`text-[13px] md:text-[14px] leading-relaxed flex-1 ${bodyCls}`}>
                    {ann.content && ann.content.length > 120 && !isExpanded ? (
                      <>
                        {ann.content.slice(0, 120)}
                        <span className="opacity-40">...</span>
                        <button
                          onClick={() => setExpanded(ann.id)}
                          className="inline-flex items-center gap-0.5 ml-1 text-xs font-semibold hover:underline transition-colors"
                          style={{ color: primaryColor }}
                        >
                          {t?.(TRANSLATIONS?.announcements?.readMore || { en: "Read more", fr: "Lire plus" }) || "Read more"}
                          <FiChevronRight className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        {ann.content}
                        {isExpanded && (
                          <button
                            onClick={() => setExpanded(null)}
                            className="block mt-2 text-xs font-semibold hover:underline transition-colors"
                            style={{ color: primaryColor }}
                          >
                            {t?.(TRANSLATIONS?.announcements?.showLess || { en: "Show less", fr: "Voir moins" }) || "Show less"}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Audience tag (if specific) */}
                  {ann.targetAudience && ann.targetAudience !== "all" && (
                    <div className="mt-auto pt-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer CTA (if more than 6) ── */}
        {announcements.length > 6 && (
          <div className="text-center mt-12 md:mt-16">
            <button
              onClick={() => window.location.href = "#announcements"}
              className="inline-flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-full border transition-all duration-200 hover:-translate-y-0.5"
              style={{
                color: textOnPrimary,
                borderColor: `${primaryColor}40`,
                backgroundColor: primaryColor,
              }}
            >
              {t?.(TRANSLATIONS?.announcements?.viewAll || { en: "View all announcements", fr: "Voir toutes les annonces" }) || "View all announcements"}
              <FiExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
