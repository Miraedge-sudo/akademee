import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { YearContext } from "../context/YearContext";

export default function AcademicYearGuard({ children }) {
  const { years, loading } = useContext(YearContext);
  const location = useLocation();

  // Still loading years
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
          <p className="text-sm text-surface-400">Loading academic years...</p>
        </div>
      </div>
    );
  }

  // No academic years found — redirect to creation page
  // But don't redirect if we're already on the creation page
  if (
    (!years || years.length === 0) &&
    location.pathname !== "/onboarding/academic-year"
  ) {
    return <Navigate to="/onboarding/academic-year" replace />;
  }

  return children;
}
