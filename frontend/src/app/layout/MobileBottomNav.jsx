import { FiMenu, FiGrid, FiUsers, FiBarChart2, FiDollarSign, FiBook, FiCalendar } from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../core/hooks/useAuth";
import { getPrimaryRole } from "../core/utils/roleUtils";

// ── Primary entries per role (max 4) + Menu ──
const BOTTOM_CONFIG = {
  ADMIN: [
    { key: "dashboard", path: "/dashboard", icon: "grid" },
    { key: "users", path: "/dashboard/users", icon: "users" },
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
  ACCOUNTANT: [
    { key: "dashboard", path: "/dashboard", icon: "grid" },
    { key: "payments", path: "/dashboard/payments", icon: "dollar" },
    { key: "fees", path: "/dashboard/fees", icon: "dollar" },
    { key: "financeReports", path: "/dashboard/finance/reports", icon: "barchart" },
  ],
};

// ── Tiny icons specifically for the bottom bar ──
const ICON_MAP = {
  grid: FiGrid,
  users: FiUsers,
  barchart: FiBarChart2,
  dollar: FiDollarSign,
  classes: FiBook,
  calendar: FiCalendar,
};

function BottomIcon({ name, className }) {
  const Icon = ICON_MAP[name];
  return Icon ? <Icon className={className} /> : null;
}

export default function MobileBottomNav({ onOpenMenu }) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const location = useLocation();

  const role = getPrimaryRole(user?.roles);
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
                ? "text-primary-600 dark:text-primary-400"
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
        <FiMenu className="w-5 h-5" />
        <span className="text-[10px] font-medium">
          {t("nav.menu", "Menu")}
        </span>
      </button>
    </nav>
  );
}
