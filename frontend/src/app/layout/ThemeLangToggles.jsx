import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from '../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';

const btnClass =
  "w-9 h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors";

export default function ThemeLangToggles({ showLang = true, showTheme = true }) {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      {showTheme && (
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={btnClass}
        >
          {theme === 'light' ? (
            <FiMoon className="w-[18px] h-[18px]" />
          ) : (
            <FiSun className="w-[18px] h-[18px]" />
          )}
        </button>
      )}

      {showLang && (
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
          className={`${btnClass} text-sm font-semibold`}
        >
          {i18n.language === "en" ? 'FR' : 'EN'}
        </button>
      )}
    </div>
  );
}
