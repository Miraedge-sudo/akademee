import { useTranslation } from "react-i18next";

export default function StudentsListPage() {
  const { t, i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t("students.title", "Students")}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang === "fr" ? "Gérer les élèves" : "Manage students"}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-surface-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
            {lang === "fr" ? "Module élèves" : "Students Module"}
          </h3>
          <p className="text-sm text-surface-400 max-w-md">
            {lang === "fr"
              ? "Cette section vous permettra de gérer les inscriptions, les dossiers et le suivi des élèves."
              : "This section will let you manage registrations, records, and student tracking."}
          </p>
        </div>
      </div>
    </div>
  );
}
