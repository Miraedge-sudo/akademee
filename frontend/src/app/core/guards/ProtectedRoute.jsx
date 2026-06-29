import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, onboardingCompleted, user } = useAuth();
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
  const educationalSystems = user?.school?.educationalSystems;
  const needsSystemSelection = onboardingCompleted &&
    (!educationalSystems || educationalSystems.length === 0) &&
    location.pathname !== "/educational-system-selection";

  if (needsSystemSelection) {
    return <Navigate to="/educational-system-selection" replace />;
  }

  return children;
}
