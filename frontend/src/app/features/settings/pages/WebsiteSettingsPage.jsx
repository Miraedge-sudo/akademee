import { useTranslation } from 'react-i18next';

export default function WebsiteSettingsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-teal-600 dark:text-teal-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t('websiteSettings.title', 'Site Vitrine')}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {t('websiteSettings.subtitle', 'Gérez l\'apparence et le contenu de votre site vitrine')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-surface-400">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-2">
          {t('websiteSettings.comingSoon', 'Bientôt disponible')}
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-md mx-auto">
          {t('websiteSettings.comingSoonDesc', 'La gestion complète de votre site vitrine sera disponible ici. Vous pourrez personnaliser l\'apparence, gérer les pages et publier votre site.')}
        </p>
      </div>
    </div>
  );
}
