import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CLASS_META = {
  "lower-secondary": {
    icon: "📗",
    titleKey: "classes.lowerSecondary",
    system: "Anglophone General",
    description: "Form 1 · Form 2 · Form 3 · Form 4 · Form 5",
    descriptionFr: "Form 1 · Form 2 · Form 3 · Form 4 · Form 5",
  },
  "upper-secondary": {
    icon: "📘",
    titleKey: "classes.upperSecondary",
    system: "Anglophone General",
    description: "Lower Sixth · Upper Sixth",
    descriptionFr: "Lower Sixth · Upper Sixth",
  },
  college: {
    icon: "📙",
    titleKey: "classes.college",
    system: "Francophone General",
    description: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Premier cycle)",
    descriptionFr: "6ᵉ · 5ᵉ · 4ᵉ · 3ᵉ (Premier cycle)",
  },
  lycee: {
    icon: "📕",
    titleKey: "classes.lycee",
    system: "Francophone General",
    description: "Seconde · Première · Terminale (Second cycle)",
    descriptionFr: "Seconde · Première · Terminale (Second cycle)",
  },
};

export default function ClassesChildrenSection() {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const classSlug = location.pathname.replace("/dashboard/classes/", "");
  const meta = CLASS_META[classSlug] || {
    icon: "📚",
    titleKey: "classes.title",
    system: "",
    description: "Class levels",
    descriptionFr: "Niveaux de classe",
  };
  const lang = i18n.language === "fr" ? "fr" : "en";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-2xl shadow-lg">
          {meta.icon}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t(meta.titleKey, classSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-surface-400">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
            {t("classes.comingSoon", "Module en cours de développement")}
          </h3>
          <p className="text-sm text-surface-400 max-w-md">
            {lang === "fr"
              ? "Cette section vous permettra de gérer les niveaux et les classes."
              : "This section will let you manage class levels and sections."}
          </p>
        </div>
      </div>
    </div>
  );
}
