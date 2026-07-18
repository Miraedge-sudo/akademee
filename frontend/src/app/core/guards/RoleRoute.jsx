import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../constants/roles";

const DASHBOARD_HOME_BY_ROLE = {
  [ROLES.ADMIN]: "/dashboard",
  [ROLES.TEACHER]: "/dashboard/teacher-home",
  [ROLES.STUDENT]: "/dashboard/student-home",
  [ROLES.ACCOUNTANT]: "/dashboard/accountant-home",
  [ROLES.SECRETARY]: "/dashboard",
  [ROLES.PARENT]: "/dashboard/parent-home",
};

export default function RoleRoute({ allowedRoles = [], children, redirectTo = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-surface-600 dark:text-surface-400">Chargement...</div>
      </div>
    );
  }

  const userRoles = (user?.roles || []).map((role) => String(role).toUpperCase());
  const hasAccess = allowedRoles.length === 0 || allowedRoles.some((role) => userRoles.includes(role.toUpperCase()));

  if (!hasAccess) {
    const fallback = redirectTo || DASHBOARD_HOME_BY_ROLE[userRoles[0]] || "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
