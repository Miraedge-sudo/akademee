import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * WebsiteSettingsPage is now redirected to the unified OnboardingPage
 * in settings mode. This page exists only as a redirect wrapper for
 * backward compatibility.
 */
export default function WebsiteSettingsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/onboarding?mode=settings", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
        <p className="text-sm text-surface-400">Redirecting...</p>
      </div>
    </div>
  );
}
