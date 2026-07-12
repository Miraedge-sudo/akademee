import { FiChevronRight, FiGlobe, FiSettings, FiUsers, FiBell, FiCalendar } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const lang = i18n.language === "fr" ? "fr" : "en";

  const settingsItems = [
    {
      key: "academic-years",
      icon: <FiCalendar className="w-5 h-5" />,
      label: "Academic Years",
      labelFr: "Années scolaires",
      desc: "Manage school years, terms and periods",
      descFr: "Gérer les années scolaires et trimestres",
      path: "/dashboard/academic-years",
    },
    {
      key: "website",
      icon: <FiGlobe className="w-5 h-5" />,
      label: "Campus Website",
      labelFr: "Site Vitrine",
      desc: "Configure your school's public website",
      descFr: "Configurer le site public de votre école",
      path: "/dashboard/website",
    },
    {
      key: "general",
      icon: <FiSettings className="w-5 h-5" />,
      label: "General Settings",
      labelFr: "Paramètres généraux",
      desc: "School info, branding, localization",
      descFr: "Infos école, image de marque, localisation",
      path: "#",
    },
    {
      key: "users",
      icon: <FiUsers className="w-5 h-5" />,
      label: "Users & Roles",
      labelFr: "Utilisateurs & Rôles",
      desc: "Manage staff accounts and permissions",
      descFr: "Gérer les comptes et permissions",
      path: "#",
    },
    {
      key: "notifications",
      icon: <FiBell className="w-5 h-5" />,
      label: "Notifications",
      labelFr: "Notifications",
      desc: "Configure email & SMS alerts",
      descFr: "Configurer les alertes email & SMS",
      path: "#",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
          {t("settings.title", "Settings")}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {lang === "fr" ? "Gérer les paramètres de votre école" : "Manage your school settings"}
        </p>
      </div>

      <div className="grid gap-4">
        {settingsItems.map((item) => (
          <button
            key={item.key}
            onClick={() => item.path !== "#" && navigate(item.path)}
            className="flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-primary-400 hover:shadow-sm transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-xl flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                {lang === "fr" ? item.labelFr : item.label}
              </div>
              <div className="text-xs text-surface-500 mt-0.5">
                {lang === "fr" ? item.descFr : item.desc}
              </div>
            </div>
            <FiChevronRight className="w-5 h-5 text-surface-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
