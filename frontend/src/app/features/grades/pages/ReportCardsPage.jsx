import { useTranslation } from "react-i18next";

export default function ReportCardsPage() {
  const { t, i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-2xl shadow-lg">📄</div>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t("reportCards.title", "Report Cards")}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang === "fr" ? "Bulletins scolaires" : "Student report cards"}
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
