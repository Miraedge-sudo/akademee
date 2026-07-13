import { FiBarChart2 } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const GRADE_SYSTEMS = {
  anglophone: {
    label: "Anglophone System",
    labelFr: "Système Anglophone",
    description: "GCE grading scale (A–U)",
    descriptionFr: "Barème GCE (A–U)",
  },
  francophone: {
    label: "Francophone System",
    labelFr: "Système Francophone",
    description: "French grading scale (0–20)",
    descriptionFr: "Barème français (0–20)",
  },
};

export default function GradesPage() {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const lang = i18n.language === "fr" ? "fr" : "en";

  // Extract the system from the path: /dashboard/grades/anglophone or /dashboard/grades/francophone
  const pathParts = location.pathname.split("/");
  const systemSlug = pathParts[pathParts.length - 1];
  const system = systemSlug !== "grades" ? GRADE_SYSTEMS[systemSlug] : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-2xl shadow-lg"><FiBarChart2 className="w-6 h-6" /></div>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t("grades.title", "Grades & Reports")}
          </h1>
          {system && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
              {lang === "fr" ? system.labelFr : system.label}
            </span>
          )}
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {system
              ? (lang === "fr" ? system.descriptionFr : system.description)
              : (lang === "fr" ? "Gestion des notes et relevés" : "Grades and records management")}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-surface-400">{lang === "fr" ? "Module en cours de développement" : "Module coming soon"}</p>
        </div>
      </div>
    </div>
  );
}
