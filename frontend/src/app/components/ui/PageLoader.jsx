import { FiBookOpen, FiBarChart2, FiClock, FiStar } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const LOADING_TIPS = {
  en: [
    'Generating student averages...',
    'Calculating class rankings...',
    'Processing grade coefficients...',
    'Computing mention thresholds...',
    'Loading academic periods...',
    'Preparing report card data...',
    'Fetching student records...',
    'Applying grading scales...',
  ],
  fr: [
    'Calcul des moyennes des élèves...',
    'Classement des élèves...',
    'Traitement des coefficients...',
    'Calcul des seuils de mentions...',
    'Chargement des périodes...',
    'Préparation des bulletins...',
    'Récupération des données...',
    'Application des barèmes...',
  ],
};

const ICONS = [FiBookOpen, FiBarChart2, FiClock, FiStar];

export default function PageLoader({
  fullScreen = true,
  message,
  lang = 'en',
  variant = 'default',
}) {
  const [tipIndex, setTipIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS[lang].length);
    }, 3000);

    const iconInterval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % ICONS.length);
    }, 2000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(iconInterval);
    };
  }, [lang]);

  const tips = LOADING_TIPS[lang] || LOADING_TIPS.en;
  const CurrentIcon = ICONS[iconIndex];

  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? 'fixed inset-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm' : 'min-h-[60vh]'
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* ── Animated icon orb ── */}
        <div className="relative w-20 h-20">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--primary-color, #085041)' }} />
          {/* Orb background */}
          <div className="absolute inset-0 rounded-full bg-white dark:bg-surface-800 shadow-xl flex items-center justify-center animate-pulse-slow border-2" style={{ borderColor: 'var(--primary-color, #085041)' }}>
            <CurrentIcon
              size={28}
              className="transition-all duration-500"
              style={{ color: 'var(--primary-color, #085041)' }}
            />
          </div>
          {/* Spinning ring */}
          <svg className="absolute inset-0 w-full h-full animate-rotate-ring" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="60 180"
              className="text-primary-200 dark:text-primary-800"
              style={{ color: 'var(--primary-color, #085041)', opacity: 0.3 }}
            />
          </svg>
        </div>

        {/* ── Message ── */}
        {message ? (
          <p className="text-[15px] font-semibold text-surface-700 dark:text-surface-200">
            {message}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Animated dots */}
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-semibold text-surface-700 dark:text-surface-200">
                Chargement
              </span>
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-color, #085041)', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-color, #085041)', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-color, #085041)', animationDelay: '300ms' }} />
              </span>
            </div>
            {/* Loading tip */}
            <p className="text-[12px] text-surface-400 transition-all duration-500">
              {tips[tipIndex]}
            </p>
          </div>
        )}

        {/* ── Progress bar ── */}
        <div className="w-48 h-1 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
          <div
            className="h-full rounded-full animate-gradient"
            style={{
              width: '40%',
              background: 'linear-gradient(90deg, var(--primary-color, #085041), var(--primary-color, #085041)88, var(--primary-color, #085041))',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}
