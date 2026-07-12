import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiBook, FiTrendingUp, FiMonitor } from "react-icons/fi";

const SERIES_META = {
  arts: {
    icon: <FiBook className="w-6 h-6" />,
    titleKey: "series.arts",
    system: "Anglophone General",
    description: "Series A1 (Lit., Fr., Hist.) – A8 (Arts & Culture)",
    descriptionFr: "Séries A1 (Litt., Fr., Hist.) – A8 (Arts & Culture)",
  },
  science: {
    icon: <FiMonitor className="w-6 h-6" />,
    titleKey: "series.science",
    system: "Anglophone General",
    description: "Series S1 (Math, Chem, Phys) – S4 (Bio, Chem, Geo)",
    descriptionFr: "Séries S1 (Math, Chim, Phys) – S4 (Bio, Chim, Géo)",
  },
  literary: {
    icon: <FiBook className="w-6 h-6" />,
    titleKey: "series.literary",
    system: "Francophone General",
    description: "Séries A (Lettres), A1–A5 (Langues, Philosophie)",
    descriptionFr: "Séries A (Lettres), A1–A5 (Langues, Philosophie)",
  },
  scientific: {
    icon: <FiMonitor className="w-6 h-6" />,
    titleKey: "series.scientific",
    system: "Francophone General",
    description: "Séries C (Math-Phys), D (Math-SVT), E (Math-Tech)",
    descriptionFr: "Séries C (Math-Phys), D (Math-SVT), E (Math-Tech)",
  },
  economic: {
    icon: <FiTrendingUp className="w-6 h-6" />,
    titleKey: "series.economic",
    system: "Francophone General",
    description: "Série B (Sciences Économiques et Sociales)",
    descriptionFr: "Série B (Sciences Économiques et Sociales)",
  },
  technical: {
    icon: <FiMonitor className="w-6 h-6" />,
    titleKey: "series.tech",
    system: "Francophone General",
    description: "Série TI (Technologies de l'Information)",
    descriptionFr: "Série TI (Technologies de l'Information)",
  },
};

export default function SeriesSection() {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const seriesSlug = location.pathname.replace("/dashboard/series/", "");
  const meta = SERIES_META[seriesSlug] || {
    icon: <FiBook className="w-6 h-6" />,
    titleKey: "series.title",
    system: "",
    description: "Series & specialties",
    descriptionFr: "Séries & spécialités",
  };
  const lang = i18n.language === "fr" ? "fr" : "en";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-2xl shadow-lg">
          {meta.icon}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t(meta.titleKey, seriesSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang === "fr" ? meta.descriptionFr : meta.description}
          </p>
          {meta.system && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
              {meta.system}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
            <FiBook className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
            {t("series.comingSoon", "Module en cours de développement")}
          </h3>
          <p className="text-sm text-surface-400 max-w-md">
            {lang === "fr"
              ? "Cette section vous permettra de gérer les séries et spécialités académiques."
              : "This section will let you manage academic series and specialties."}
          </p>
        </div>
      </div>
    </div>
  );
}
