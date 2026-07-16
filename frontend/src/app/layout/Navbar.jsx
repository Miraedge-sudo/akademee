import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../core/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import ThemeLangToggles from './ThemeLangToggles';
import { ROLES } from '../core/constants/roles';
import { buildSubdomainUrl } from '../core/utils/subdomainHelper';
import { YearContext } from '../core/context/YearContext';

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');
  const { selectedYearId, years } = useContext(YearContext);

  const activeYear = years.find((y) => y.id === selectedYearId) || years.find((y) => y.isCurrent) || null;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropdownRef = useRef(null);

  const role = user?.roles?.[0] || ROLES.ADMIN;

  // Settings menu items based on role
  const settingsItems = [];
  if (role === ROLES.ADMIN) {
    settingsItems.push(
      { key: 'settings', path: '/dashboard/settings', icon: 'settings', label: t('navbar.settings', 'Paramètres') },
      { key: 'website', path: '/dashboard/website', icon: 'website', label: t('navbar.siteVitrine', 'Site vitrine') },
      { key: 'announcements', path: '/dashboard/announcements', icon: 'announcements', label: t('navbar.announcements', 'Annonces') },
    );
  } else if (role === ROLES.TEACHER) {
    settingsItems.push(
      { key: 'settings', path: '/dashboard/settings', icon: 'settings', label: t('navbar.settings', 'Paramètres') },
    );
  }

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
    const schoolSubdomain = localStorage.getItem('akademee-subdomain');
    logout();
    if (schoolSubdomain) {
      // Redirect to the school's vitrine website
      window.location.href = buildSubdomainUrl(schoolSubdomain, '/site');
    } else {
      navigate('/login');
    }
  };

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || '?'
    : '?';
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User'
    : 'User';

  return (
    <header className="h-14 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 flex items-center px-2 sm:px-4 gap-1 sm:gap-3 transition-colors">

      {/* Burger / sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="w-9 h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shrink-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Breadcrumb (brand + active year — hidden on smallest screens) */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
        <span className="hidden sm:inline text-sm text-surface-400 shrink-0">Akademee</span>
        <span className="hidden sm:inline text-surface-300 shrink-0">/</span>
        <span className="text-sm font-medium text-surface-800 dark:text-surface-100 truncate">
          {t('navbar.dashboard')}
        </span>

        {/* Active academic year badge */}
        {activeYear && (
          <>
            <span className="hidden sm:inline text-surface-300 shrink-0">/</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700/50 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="hidden sm:inline">{activeYear.name}</span>
            </span>
          </>
        )}
      </div>

      {/* Desktop search */}
      <div className="hidden md:flex items-center gap-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded-md px-3 h-9 w-40 lg:w-52 transition-all">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 text-surface-400 shrink-0">
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
        className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shrink-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-surface-800" />
      </button>

      <div className="hidden md:block w-px h-5 bg-surface-200 dark:bg-surface-600 shrink-0" />

      {/* User pill with dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1 sm:gap-2 pl-0.5 pr-1.5 sm:pl-1 sm:pr-2.5 h-8 sm:h-9 rounded-full border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
        >
          <div className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full bg-primary-700 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold text-primary-100">
            {initials}
          </div>
          <span className="hidden sm:inline text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-200 truncate max-w-[80px] lg:max-w-[140px]">
            {displayName}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-surface-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown menu — note: w-52 to accommodate submenu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-lg shadow-lg py-1 z-50">
            {/* Profile */}
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

            {settingsItems.length > 0 && (
              <>
                <div className="h-px bg-surface-100 dark:bg-surface-700 mx-2" />

                {/* Settings with hover submenu */}
                <div className="relative group/sub">
                  <div
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-left cursor-default"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-surface-400">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span className="flex-1">{t('navbar.settingsGroup', 'Paramètres')}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3 text-surface-400">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </div>

                  {/* Submenu on hover — appears to the left */}
                  <div className="absolute right-full top-0 mr-1.5 w-48 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-lg shadow-lg py-1 z-[60] hidden group-hover/sub:block">
                    {settingsItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate(item.path);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-left"
                      >
                        {item.icon === 'website' ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-surface-400">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        ) : item.icon === 'announcements' ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-surface-400">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-surface-400">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                        )}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

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