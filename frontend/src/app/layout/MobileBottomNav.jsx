import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../core/hooks/useAuth";

// ── Primary entries per role (max 4) + Menu ──
const BOTTOM_CONFIG = {
  ADMIN: [
    { key: "dashboard", path: "/dashboard", icon: "grid" },
    { key: "students", path: "/dashboard/students", icon: "users" },
    { key: "gradeReports", path: "/dashboard/grades", icon: "barchart" },
    { key: "finance", path: "/dashboard/finance", icon: "dollar" },
  ],
  TEACHER: [
    { key: "dashboard", path: "/dashboard", icon: "grid" },
    { key: "myClasses", path: "/dashboard/my-classes", icon: "classes" },
    { key: "gradeEntry", path: "/dashboard/grade-entry", icon: "barchart" },
    { key: "attendance", path: "/dashboard/attendance", icon: "calendar" },
  ],
  STUDENT: [
    { key: "dashboard", path: "/dashboard", icon: "grid" },
    { key: "myGrades", path: "/dashboard/my-grades", icon: "barchart" },
    { key: "myAttendance", path: "/dashboard/my-attendance", icon: "calendar" },
    { key: "myFees", path: "/dashboard/my-fees", icon: "dollar" },
  ],
};

// ── Tiny icons specifically for the bottom bar ──
const ICONS = {
  grid: (
    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
  ),
  users: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
  ),
  barchart: (
    <path d="M18 20V10M12 20V4M6 20v-6" />
  ),
  dollar: (
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  ),
  classes: (
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zm20 0h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" />
  ),
  calendar: (
    <path d="M3 7h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm3-5v4m12-4v4M3 11h18" />
  ),
};

function BottomIcon({ name, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}

export default function MobileBottomNav({ onOpenMenu }) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.roles?.[0] || "ADMIN";
  const items = BOTTOM_CONFIG[role] || BOTTOM_CONFIG.ADMIN;

  // Vérifie si le path est actif (match exact OU commence par le path si ce n'est pas /dashboard)
  // pour que /dashboard/students soit actif sur l'icône Students
  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[100] flex items-center bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 pb-[env(safe-area-inset-bottom,0px)]">
      {/* Primary nav items */}
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <NavLink
            key={item.key}
            to={item.path}
            className={`flex-1 flex flex-col items-center justify-center h-16 gap-0.5 transition-colors ${
              active
                ? "text-teal-600 dark:text-teal-400"
                : "text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300"
            }`}
          >
            <BottomIcon
              name={item.icon}
              className={`w-5 h-5 ${active ? "stroke-[2.2]" : ""}`}
            />
            <span className={`text-[10px] font-medium leading-tight ${active ? "font-semibold" : ""}`}>
              {t(`nav.${item.key}`, item.key)}
            </span>
          </NavLink>
        );
      })}

      {/* Separator */}
      <div className="w-px h-6 bg-surface-200 dark:bg-surface-700" />

      {/* Menu button — opens sidebar drawer */}
      <button
        onClick={onOpenMenu}
        className="flex-1 flex flex-col items-center justify-center h-16 gap-0.5 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
        aria-label={t("nav.menu", "Menu")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="w-5 h-5"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        <span className="text-[10px] font-medium">
          {t("nav.menu", "Menu")}
        </span>
      </button>
    </nav>
  );
}
