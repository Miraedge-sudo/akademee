import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { useAuth } from "../hooks/useAuth";
import { YearContext } from "../context/YearContext";
import { ROLES } from "../constants/roles";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, onboardingCompleted, user } = useAuth();
  const { years, loading: yearLoading } = useContext(YearContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-surface-600 dark:text-surface-400">
          Chargement...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not completed (except if already on /onboarding)
  if (!onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // After onboarding, if no educational systems selected, redirect to selection page
  const userRoles = (user?.roles || []).map((role) => String(role).toUpperCase());
  const isAdmin = userRoles.includes(ROLES.ADMIN);
  const educationalSystems = user?.school?.educationalSystems;
  const needsSystemSelection = onboardingCompleted &&
    !isAdmin &&
    (!educationalSystems || educationalSystems.length === 0) &&
    location.pathname !== "/educational-system-selection";

  if (needsSystemSelection) {
    return <Navigate to="/educational-system-selection" replace />;
  }

  // After onboarding and system selection, if no academic year exists, redirect to creation
  const needsAcademicYear = onboardingCompleted &&
    years &&
    years.length === 0 &&
    !yearLoading &&
    location.pathname !== "/onboarding/academic-year";

  if (needsAcademicYear) {
    return <Navigate to="/onboarding/academic-year" replace />;
  }

  return children;
}
