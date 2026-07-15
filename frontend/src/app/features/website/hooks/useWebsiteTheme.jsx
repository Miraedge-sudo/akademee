import { useState, useEffect, useCallback } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

const STORAGE_KEY = "akademee-website-theme";

/**
 * Hook pour gérer le thème clair/sombre sur les templates de site vitrine.
 * Stocke la préférence dans localStorage.
 *
 * @param {string} defaultTheme - "light" | "dark" — thème par défaut du template
 * @returns {{ theme, toggleTheme, isDark, ThemeToggle }}
 */
export function useWebsiteTheme(defaultTheme = "light") {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch { /* ignore */ }
    return defaultTheme;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const isDark = theme === "dark";

  /**
   * Bouton toggle à insérer dans la navbar du template.
   */
  function ThemeToggle({ variant = "light" }) {
    const textColor = variant === "dark" ? "text-white/70 hover:text-white" : "text-surface-500 hover:text-surface-800 dark:text-white/70 dark:hover:text-white";
    const bgHover = variant === "dark" ? "hover:bg-white/10" : "hover:bg-surface-100 dark:hover:bg-white/10";

    return (
      <button
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={`w-9 h-9 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer transition-all duration-200 ${textColor} ${bgHover}`}
        title={isDark ? "Mode clair" : "Mode sombre"}
      >
        {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
      </button>
    );
  }

  return { theme, toggleTheme, isDark, ThemeToggle };
}
