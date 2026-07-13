import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAward } from "react-icons/fi";

const PROGRAMS_META = {
  licence: {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "programs.licence",
    description: "Licence (Bac+3) · Bachelor degree",
    descriptionFr: "Licence (Bac+3) · Bachelor",
  },
  master: {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "programs.master",
    description: "Master (Bac+5) · Advanced degree",
    descriptionFr: "Master (Bac+5) · Diplôme avancé",
  },
  doctorate: {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "programs.doctorate",
    description: "Doctorat (Bac+8) · PhD",
    descriptionFr: "Doctorat (Bac+8) · PhD",
  },
};

export default function ProgramsSection() {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const programSlug = location.pathname.replace("/dashboard/programs/", "");
  const meta = PROGRAMS_META[programSlug] || {
    icon: <FiAward className="w-6 h-6" />,
    titleKey: "programs.title",
    description: "LMD Programs",
    descriptionFr: "Programmes LMD",
  };
  const lang = i18n.language === "fr" ? "fr" : "en";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-2xl shadow-lg">
          {meta.icon}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
            {t(meta.titleKey, programSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang === "fr" ? meta.descriptionFr : meta.description}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
            <FiAward className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
            {t("programs.comingSoon", "Module en cours de développement")}
          </h3>
          <p className="text-sm text-surface-400 max-w-md">
            {lang === "fr"
              ? "Cette section vous permettra de gérer les programmes LMD."
              : "This section will let you manage LMD programs."}
          </p>
        </div>
      </div>
    </div>
  );
}
