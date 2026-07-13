import { useState, useCallback, useMemo } from "react";

/**
 * Determine which languages are available based on educational systems.
 */
function detectLanguages(systems = []) {
  const normalized = systems.map((s) => String(s).toLowerCase());
  const hasAnglophone = normalized.some(
    (s) => s.includes("anglo") || s === "gce" || s === "igcse" || s === "international"
  );
  const hasFrancophone = normalized.some(
    (s) =>
      s.includes("franco") ||
      s === "bepc" ||
      s === "probatoire" ||
      s === "baccalaureat" ||
      s === "bac" ||
      s === "cap"
  );

  // Legacy bilingual flag
  const isBilingual = normalized.some((s) => s === "bilingual");

  return {
    hasAnglophone: hasAnglophone || isBilingual,
    hasFrancophone: hasFrancophone || isBilingual,
    isBilingual: (hasAnglophone && hasFrancophone) || isBilingual,
  };
}

/**
 * Hook for multilingual website templates.
 *
 * @param {string[]} educationalSystems - Array of educational system codes from the school data
 * @returns {{ lang: string, isBilingual: boolean, toggleLang: () => void, t: (fr: string, en: string) => string }}
 */
export function useWebsiteLanguage(educationalSystems = []) {
  const langs = useMemo(() => detectLanguages(educationalSystems), [educationalSystems]);

  const defaultLang = langs.hasFrancophone && !langs.hasAnglophone ? "fr" : "en";
  const [lang, setLang] = useState(defaultLang);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "fr" ? "en" : "fr"));
  }, []);

  // Accept either { fr, en } object or (fr, en) strings
  const t = useCallback(
    (translations) => {
      if (typeof translations === "object" && translations !== null) {
        return translations[lang] || translations.en || "";
      }
      return translations;
    },
    [lang]
  );

  return {
    lang,
    isBilingual: langs.isBilingual,
    toggleLang,
    t,
  };
}

/**
 * Language toggle button component.
 */
export function LanguageToggle({ lang, isBilingual, onToggle, variant = "light" }) {
  if (!isBilingual) return null;

  const bg = variant === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const border = variant === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
  const textColor = variant === "dark" ? "#fff" : "#1a1a1a";
  const activeBg = variant === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";

  return (
    <button
      onClick={onToggle}
      aria-label="Toggle language"
      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer hover:scale-105 active:scale-95"
      style={{
        background: bg,
        borderColor: border,
        color: textColor,
      }}
    >
      <span
        className="px-1.5 py-0.5 rounded-full transition-all duration-200"
        style={{
          background: lang === "fr" ? activeBg : "transparent",
          opacity: lang === "fr" ? 1 : 0.5,
        }}
      >
        FR
      </span>
      <span className="opacity-30 text-[8px]">|</span>
      <span
        className="px-1.5 py-0.5 rounded-full transition-all duration-200"
        style={{
          background: lang === "en" ? activeBg : "transparent",
          opacity: lang === "en" ? 1 : 0.5,
        }}
      >
        EN
      </span>
    </button>
  );
}
