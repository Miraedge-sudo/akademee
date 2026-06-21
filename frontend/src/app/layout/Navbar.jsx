import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../core/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import ThemeLangToggles from './ThemeLangToggles';

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le dropdown en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setConfirmLogout(false);
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || '?'
    : '?';
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User'
    : 'User';

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

      <ThemeLangToggles />

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

      {/* User pill with dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 pl-1 pr-2.5 h-9 rounded-full border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
        >
          <div className="w-[26px] h-[26px] rounded-full bg-teal-700 flex items-center justify-center text-[11px] font-semibold text-teal-100">
            {initials}
          </div>
          <span className="hidden md:inline text-sm font-medium text-surface-700 dark:text-surface-200">
            {displayName}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`w-3.5 h-3.5 text-surface-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-lg shadow-lg py-1 z-50">
            {/* Profile (placeholder) */}
            <button
              onClick={() => setDropdownOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-left"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-surface-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t('navbar.profile', 'Profile')}
            </button>

            <div className="h-px bg-surface-100 dark:bg-surface-700 mx-2" />

            {/* Logout */}
            <button
              onClick={() => { setDropdownOpen(false); setConfirmLogout(true); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t('navbar.logout', 'Log out')}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-600 p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-500">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                  {t('navbar.confirmLogoutTitle', 'Log out')}
                </h3>
                <p className="text-xs text-surface-400 mt-0.5">
                  {t('navbar.confirmLogoutMsg', 'Are you sure you want to log out?')}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 h-10 text-sm font-medium text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-md transition-colors"
              >
                {t('actions.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 h-10 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('navbar.confirmLogout', 'Log out')}
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}