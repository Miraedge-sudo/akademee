import { useTheme } from '../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function Navbar({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common')
  const { i18n }= useTranslation();
  const toggle = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')
  }

  return (
    <header className="h-14 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 flex items-center px-4 gap-3 transition-colors">

      {/* Burger / collapse */}
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="w-9 h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm text-surface-400">Akademee</span>
        <span className="text-surface-300">/</span>
        <span className="text-sm font-medium text-surface-800 dark:text-surface-100">
          {t('navbar.dashboard')}
        </span>
      </div>

      {/* Search (desktop only) */}
      <div className="hidden md:flex items-center gap-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded-md px-3 h-9 w-52">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 text-surface-400 flex-shrink-0">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={t("navbar.search")}
          className="bg-transparent outline-none text-sm text-surface-800 dark:text-surface-100 placeholder:text-surface-400 w-full"
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="w-9 h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      >
        {theme === 'light' ? (
          // Moon icon (switch to dark)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          // Sun icon (switch to light)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>

      {/* Language Selector  */}
      <button onClick={toggle} className='w-9 h-9 flex items-center justify-center rounded-md text-sm font-semibold text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'>
        {i18n.language === "en" ? 'FR': 'EN'}
      </button>

      {/* Notifications */}
      <button
        aria-label="Notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-surface-800" />
      </button>

      <div className="hidden md:block w-px h-5 bg-surface-200 dark:bg-surface-600" />

      {/* User pill */}
      <button className="flex items-center gap-2 pl-1 pr-2.5 h-9 rounded-full border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
        <div className="w-6.5 h-6.5 w-[26px] h-[26px] rounded-full bg-teal-700 flex items-center justify-center text-[11px] font-semibold text-teal-100">
          JD
        </div>
        <span className="hidden md:inline text-sm font-medium text-surface-700 dark:text-surface-200">
          Jean Dupont
        </span>
      </button>

    </header>
  );
}