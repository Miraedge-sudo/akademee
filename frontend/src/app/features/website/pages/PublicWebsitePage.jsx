import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getPublicWebsite } from "../../../core/api/websiteService";
import ModernTemplate from "../templates/ModernTemplate";
import ClassicTemplate from "../templates/ClassicTemplate";
import MinimalTemplate from "../templates/MinimalTemplate";

export default function PublicWebsitePage() {
  const [searchParams] = useSearchParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const subdomain =
      searchParams.get("subdomain") ||
      getSubdomainFromHostname();

    if (!subdomain) {
      setError("No school subdomain found.");
      setLoading(false);
      return;
    }

    getPublicWebsite(subdomain)
      .then((data) => {
        if (!data.websitePublished) {
          setError("This school's website is not published yet.");
        } else {
          setSchool(data);
        }
      })
      .catch(() => setError("School not found."))
      .finally(() => setLoading(false));
  }, [searchParams]);

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
      {templateCode === "modern"  && <ModernTemplate  school={school} />}
      {templateCode === "classic" && <ClassicTemplate school={school} />}
      {templateCode === "minimal" && <MinimalTemplate school={school} />}
    </>
  );
}

// Extrait le subdomain depuis l'hostname en prod
// ex: grace-bilingual.akademee.cm → "grace-bilingual"
function getSubdomainFromHostname() {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length >= 3) return parts[0];
  return null;
}