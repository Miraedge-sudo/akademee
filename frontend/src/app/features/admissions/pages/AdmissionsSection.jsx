import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiUsers, FiClipboard, FiBarChart2 } from "react-icons/fi";

const ADMISSIONS_META = {
  applications: {
    icon: <FiClipboard className="w-6 h-6" />,
    titleKey: "admissions.applications",
    description: "Manage admission applications",
    descriptionFr: "Gérer les demandes d'admission",
  },
  enrollment: {
    icon: <FiBarChart2 className="w-6 h-6" />,
    titleKey: "admissions.enrollment",
    description: "Enrollment statistics & tracking",
    descriptionFr: "Statistiques et suivi des inscriptions",
  },
};

export default function AdmissionsSection() {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const admissionSlug = location.pathname.replace("/dashboard/admissions/", "");
  const meta = ADMISSIONS_META[admissionSlug] || {
    icon: <FiClipboard className="w-6 h-6" />,
    titleKey: "admissions.title",
    description: "Admissions",
    descriptionFr: "Admissions",
  };
  const lang = i18n.language === "fr" ? "fr" : "en";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-2xl shadow-lg">
          {meta.icon}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t(meta.titleKey, admissionSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang === "fr" ? meta.descriptionFr : meta.description}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
            <FiUsers className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
            {t("admissions.comingSoon", "Module en cours de développement")}
          </h3>
          <p className="text-sm text-surface-400 max-w-md">
            {lang === "fr"
              ? "Cette section vous permettra de gérer les admissions et inscriptions."
              : "This section will let you manage admissions and enrollment."}
          </p>
        </div>
      </div>
    </div>
  );
}
