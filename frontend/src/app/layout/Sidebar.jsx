import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../core/hooks/useAuth";

// ── Nav config per role ──
const NAV_CONFIG = {
  ADMIN: [
    {
      group: "overview",
      items: [
        { key: "dashboard", path: "/dashboard", icon: "grid" },
      ],
    },
    {
      group: "academic",
      items: [
        { key: "students", path: "/dashboard/students", icon: "users", badge: 248 },
        { key: "classes", path: "/dashboard/classes", icon: "classes" },
        { key: "subjects", path: "/dashboard/subjects", icon: "subjects" },
        { key: "teachers", path: "/dashboard/teachers", icon: "teacher" },
      ],
    },
    {
      group: "grades",
      items: [
        { key: "gradeReports", path: "/dashboard/grades", icon: "barchart" },
        { key: "reportCards", path: "/dashboard/report-cards", icon: "file" },
        { key: "attendance", path: "/dashboard/attendance", icon: "calendar" },
      ],
    },
    {
      group: "finance",
      items: [
        { key: "finance", path: "/dashboard/finance", icon: "dollar", badge: 3 },
      ],
    },
    {
      group: "system",
      items: [
        { key: "settings", path: "/dashboard/settings", icon: "settings" },
      ],
    },
  ],
  TEACHER: [
    {
      group: "overview",
      items: [{ key: "dashboard", path: "/dashboard", icon: "grid" }],
    },
    {
      group: "academic",
      items: [
        { key: "myClasses", path: "/dashboard/my-classes", icon: "classes" },
        { key: "gradeEntry", path: "/dashboard/grade-entry", icon: "barchart" },
        { key: "attendance", path: "/dashboard/attendance", icon: "calendar" },
      ],
    },
  ],
  STUDENT: [
    {
      group: "overview",
      items: [{ key: "dashboard", path: "/dashboard", icon: "grid" }],
    },
    {
      group: "academic",
      items: [
        { key: "myGrades", path: "/dashboard/my-grades", icon: "barchart" },
        { key: "myAttendance", path: "/dashboard/my-attendance", icon: "calendar" },
        { key: "myFees", path: "/dashboard/my-fees", icon: "dollar" },
      ],
    },
  ],
};

// ── Icon set ──
const ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  classes: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  subjects: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  teacher: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  barchart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
};

function NavIcon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONS[name]}
    </svg>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.roles?.[0] || "ADMIN";
  const navGroups = NAV_CONFIG[role] || NAV_CONFIG.ADMIN;

  const initials = (user?.schoolName || "SC")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const userInitials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <>
      {/* Mobile overlay — always rendered for fade animation */}
      <div
        className={`fixed inset-0 z-[150] lg:hidden bg-black/45 transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`
          bg-primary-900 dark:bg-surface-950 flex flex-col flex-shrink-0 h-screen
          transition-all duration-300 ease-out overflow-hidden
          fixed lg:sticky top-0 left-0 z-[200]
          ${collapsed ? "lg:w-16" : "lg:w-60"}
          w-60
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 h-14 border-b border-white/[0.07] flex-shrink-0 overflow-hidden ${collapsed ? "lg:justify-center lg:px-0" : "px-4"}`}>
          <div className="w-8 h-8 rounded-md bg-primary-600 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className={`font-display text-lg text-primary-100 whitespace-nowrap transition-opacity ${collapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"}`}>
            Akademee
          </span>
        </div>

        {/* School badge */}
        <div className={`m-2.5 bg-white/[0.07] rounded-md flex items-center gap-2.5 flex-shrink-0 transition-[padding] overflow-hidden ${collapsed ? "lg:p-2.5 lg:justify-center" : "p-2.5"}`}>
          <div className="w-8 h-8 rounded-sm bg-primary-700 flex items-center justify-center text-[12px] font-semibold text-primary-100 flex-shrink-0">
            {initials}
          </div>
          <div className={`overflow-hidden transition-opacity ${collapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"}`}>
            <div className="text-[13px] font-semibold text-primary-100 whitespace-nowrap overflow-hidden text-ellipsis">
              {user?.schoolName || "School"}
            </div>
            <div className="text-[11px] text-primary-400 whitespace-nowrap">
              {user?.subdomain ? `${user.subdomain}.akademee.cm` : ""}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-none">
          {navGroups.map((group) => (
            <div key={group.group}>
              <div className={`text-[10px] font-semibold tracking-wider uppercase text-primary-400/60 px-5 pt-3 pb-1 whitespace-nowrap transition-opacity ${collapsed ? "lg:opacity-0 lg:hidden" : "opacity-100"}`}>
                {t(`nav.group.${group.group}`, group.group)}
              </div>

              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`
                      group relative flex items-center gap-2.5 h-10 mx-2 px-3 rounded-md
                      text-[13.5px] whitespace-nowrap overflow-hidden transition-colors
                      ${isActive
                        ? "bg-primary-600 text-white font-medium"
                        : "text-primary-200 hover:bg-white/[0.08] hover:text-white"}
                      ${collapsed ? "lg:justify-center lg:px-0" : ""}
                    `}
                  >
                    <NavIcon name={item.icon} className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className={`transition-opacity ${collapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"}`}>
                      {t(`nav.${item.key}`, item.key)}
                    </span>
                    {item.badge != null && (
                      <span className={`ml-auto bg-primary-400 text-primary-950 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 transition-opacity ${collapsed ? "lg:opacity-0 lg:hidden" : "opacity-100"}`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip when collapsed (desktop only) */}
                    {collapsed && (
                      <span className="hidden lg:group-hover:block absolute left-[60px] top-1/2 -translate-y-1/2 bg-surface-900 text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap z-[200] shadow-lg">
                        {t(`nav.${item.key}`, item.key)}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer — user */}
        <div className="border-t border-white/[0.07] p-2 flex-shrink-0">
          <div className={`flex items-center gap-2.5 h-12 px-3 rounded-md ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
            <div className="w-[30px] h-[30px] rounded-full bg-primary-700 flex items-center justify-center text-[12px] font-semibold text-primary-100 flex-shrink-0">
              {userInitials || "U"}
            </div>
            <div className={`overflow-hidden transition-opacity ${collapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"}`}>
              <div className="text-[13px] font-medium text-primary-100 whitespace-nowrap overflow-hidden text-ellipsis">
                {(user?.firstName || '') + ' ' + (user?.lastName || '') || user?.email || 'User'}
              </div>
              <div className="text-[11px] text-primary-400 whitespace-nowrap">
                {t(`roles.${role}`, role)}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
