import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getPublicWebsite } from "../../../core/api/websiteService";
import ModernTemplate from "../templates/ModernTemplate";
import ClassicTemplate from "../templates/ClassicTemplate";
import MinimalTemplate from "../templates/MinimalTemplate";
import { getSubdomain } from "../../../core/utils/subdomainHelper";

export default function PublicWebsitePage() {
  const [searchParams] = useSearchParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isPreview = searchParams.get("preview") === "1";
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    const subdomain = getSubdomain();

    if (!subdomain) {
      setError("No school subdomain found.");
      setLoading(false);
      return;
    }

    getPublicWebsite(subdomain)
      .then((data) => {
        // Allow preview mode (from onboarding) even if not published
        if (!data.websitePublished && !isPreview) {
          setError("This school's website is not published yet.");
        } else {
          setIsPreviewMode(!data.websitePublished && isPreview);
          setSchool(data);
        }
      })
      .catch(() => setError("School not found."))
      .finally(() => setLoading(false));
  }, [searchParams, isPreview]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-400">Loading campus website...</p>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <h1 className="font-display text-2xl text-surface-800 mb-2">
            Website not available
          </h1>
          <p className="text-surface-400">{error}</p>
        </div>
      </div>
    );
  }

  // Choisir le bon template selon school.templateCode
  const templateCode = school.templateCode || school.template?.code || "modern";

  return (
    <>
      {/* Preview banner — shown when accessing via ?preview=1 before publishing */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 flex-shrink-0">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Preview mode — this site is not yet published.</span>
        </div>
      )}
      {templateCode === "modern"  && <ModernTemplate  school={school} />}
      {templateCode === "classic" && <ClassicTemplate school={school} />}
      {templateCode === "minimal" && <MinimalTemplate school={school} />}
    </>
  );
}