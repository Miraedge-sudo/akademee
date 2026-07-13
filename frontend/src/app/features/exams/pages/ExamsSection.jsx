import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiFileText, FiBook, FiBarChart2, FiClipboard, FiEdit3, FiAward } from "react-icons/fi";

const EXAM_META = {
  "gce-o-level": {
    icon: <FiBook className="w-6 h-6" />,
    titleKey: "exams.gceOLevel",
    system: "Anglophone General",
    description: "GCE Ordinary Level — Forms 1 to 5 (FSLC → O-Level)",
    descriptionFr: "GCE Ordinary Level — Classes 1 à 5 (FSLC → O-Level)",
    color: "bg-blue-500",
  },
  "gce-a-level": {
    icon: <FiBook className="w-6 h-6" />,
    titleKey: "exams.gceALevel",
    system: "Anglophone General",
    description: "GCE Advanced Level — Lower & Upper Sixth",
    descriptionFr: "GCE Advanced Level — Lower & Upper Sixth",
    color: "bg-blue-600",
  },
  "gce-results": {
    icon: <FiBarChart2 className="w-6 h-6" />,
    titleKey: "exams.gceResults",
    system: "Anglophone General",
    description: "GCE results management & publication",
    descriptionFr: "Gestion et publication des résultats GCE",
    color: "bg-blue-400",
  },
  bepc: {
    icon: <FiClipboard className="w-6 h-6" />,
    titleKey: "exams.bepc",
    system: "Francophone General",
    description: "Brevet d'Études du Premier Cycle — Collège (4ᵉ année)",
    descriptionFr: "Brevet d'Études du Premier Cycle — Collège (4ᵉ année)",
    color: "bg-amber-500",
  },
  probatoire: {
    icon: <FiEdit3 className="w-6 h-6" />,
    titleKey: "exams.probatoire",
    system: "Francophone General",
    description: "Examen probatoire — 2ᵉ année du second cycle (Lycée)",
    descriptionFr: "Examen probatoire — 2ᵉ année du second cycle (Lycée)",
    color: "bg-amber-600",
  },
  baccalaureat: {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "exams.baccalaureat",
    system: "Francophone General",
    description: "Baccalauréat Général — séries A, B, C, D, E, TI",
    descriptionFr: "Baccalauréat Général — séries A, B, C, D, E, TI",
    color: "bg-amber-700",
  },
  "francophone-results": {
    icon: <FiBarChart2 className="w-6 h-6" />,
    titleKey: "exams.examResults",
    system: "Francophone General",
    description: "BEPC, Probatoire & Baccalauréat results",
    descriptionFr: "Résultats BEPC, Probatoire & Baccalauréat",
    color: "bg-amber-400",
  },
};

const EXAM_ACTIONS = [
  { key: "register", label: "Register candidates", labelFr: "Inscrire les candidats" },
  { key: "scores", label: "Enter scores", labelFr: "Saisir les notes" },
  { key: "results", label: "View results", labelFr: "Voir les résultats" },
  { key: "stats", label: "Statistics", labelFr: "Statistiques" },
];

export default function ExamsSection() {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const examSlug = location.pathname.replace("/dashboard/exams/", "");

  const meta = EXAM_META[examSlug] || {
    icon: <FiClipboard className="w-6 h-6" />,
    titleKey: "exams.title",
    system: "",
    description: "Exam management",
    descriptionFr: "Gestion des examens",
    color: "bg-primary-600",
  };

  const lang = i18n.language === "fr" ? "fr" : "en";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-xl ${meta.color} flex items-center justify-center text-2xl shadow-lg`}>
          {meta.icon}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t(meta.titleKey, examSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {EXAM_ACTIONS.map((action) => (
          <button
            key={action.key}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-primary-400 hover:shadow-sm transition-all"
          >
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {lang === "fr" ? action.labelFr : action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
            <FiFileText className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
            {t("exams.comingSoon", "Module en cours de développement")}
          </h3>
          <p className="text-sm text-surface-400 max-w-md">
            {lang === "fr"
              ? "Cette section sera bientôt disponible. Vous pourrez gérer les inscriptions, les notes et les résultats ici."
              : "This section is coming soon. You'll be able to manage registrations, scores, and results here."}
          </p>
        </div>
      </div>
    </div>
  );
}
