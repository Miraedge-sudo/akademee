import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { saveOnboardingData } from "../../../core/api/websiteService";
import akademeeLogo from "../../../../assets/Logo.png";

const SYSTEMS = [
  {
    id: "anglophone_general",
    name: "Anglophone General",
    nameFr: "Général Anglophone",
    description: "GCE O-Level & A-Level — 5+2 years",
    descriptionFr: "GCE O-Level & A-Level — 5+2 ans",
    type: "secondary",
    color: "bg-blue-500",
    borderActive: "border-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "francophone_general",
    name: "Francophone General",
    nameFr: "Général Francophone",
    description: "BEPC, Probatoire & Baccalauréat — 4+3 years",
    descriptionFr: "BEPC, Probatoire & Baccalauréat — 4+3 ans",
    type: "secondary",
    color: "bg-amber-500",
    borderActive: "border-amber-500",
    lightBg: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    id: "anglophone_technical",
    name: "Anglophone Technical",
    nameFr: "Technique Anglophone",
    description: "TVEE IL & AL — Technical & Vocational",
    descriptionFr: "TVEE IL & AL — Technique & Professionnel",
    type: "secondary",
    color: "bg-cyan-500",
    borderActive: "border-cyan-500",
    lightBg: "bg-cyan-50 dark:bg-cyan-900/20",
  },
  {
    id: "francophone_technical",
    name: "Francophone Technical",
    nameFr: "Technique Francophone",
    description: "CAP, Brevet & Baccalauréat Technique — 4+3 years",
    descriptionFr: "CAP, Brevet & Baccalauréat Technique — 4+3 ans",
    type: "secondary",
    color: "bg-purple-500",
    borderActive: "border-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    id: "university",
    name: "University",
    nameFr: "Université",
    description: "LMD — Licence, Master, Doctorate",
    descriptionFr: "LMD — Licence, Master, Doctorat",
    type: "higher",
    color: "bg-emerald-500",
    borderActive: "border-emerald-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
];

export default function EducationalSystemSelectionPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();

  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
    setError("");
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      setError("Please select at least one educational system");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await saveOnboardingData({
        educationalSystems: selected,
      });

      if (response.success) {
        navigate("/dashboard", { replace: true });
        window.location.reload();
      } else {
        setError(response.message || "Error saving selection");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(
        err.response?.data?.message || err.message || "Error saving selection",
      );
    } finally {
      setSaving(false);
    }
  };

  const lang = i18n.language === "fr" ? "fr" : "en";

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
        <div className="flex items-center gap-2.5">
          <img
            src={akademeeLogo}
            alt="Akademee"
            className="w-7 h-7 object-contain"
          />
          <span className="font-display text-base font-semibold text-surface-800 dark:text-surface-100">
            Akademee
          </span>
        </div>
        <span className="text-xs text-surface-400">
          {user?.schoolName || user?.subdomain || ""}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7 text-primary-700 dark:text-primary-300">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-bold text-surface-800 dark:text-surface-100 mb-2">
              {t("edsys.title", "Choose your educational systems")}
            </h1>
            <p className="text-surface-500 text-base max-w-md mx-auto">
              {t("edsys.subtitle", "Select the educational system(s) your school offers. You can select multiple.")}
            </p>
          </div>

          {/* Systems Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {SYSTEMS.map((sys) => {
              const isSelected = selected.includes(sys.id);
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => toggle(sys.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? `${sys.borderActive} ${sys.lightBg} shadow-sm`
                      : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600 hover:shadow-sm"
                  }`}
                >
                  {isSelected && (
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${sys.color} flex items-center justify-center`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? `${sys.color} text-white` : "bg-surface-100 dark:bg-surface-700 text-surface-500"
                    }`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                        {sys.id === "anglophone_general" && <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>}
                        {sys.id === "francophone_general" && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 12h8" /><path d="M8 8h5" /></>}
                        {sys.id === "anglophone_technical" && <><rect x="4" y="4" width="16" height="16" rx="2" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /></>}
                        {sys.id === "francophone_technical" && <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>}
                        {sys.id === "university" && <><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>}
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <div className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                        {lang === "fr" ? sys.nameFr : sys.name}
                      </div>
                      <div className="text-xs text-surface-400 mt-0.5 leading-relaxed">
                        {lang === "fr" ? sys.descriptionFr : sys.description}
                      </div>
                      <span className="inline-block mt-2 text-[10px] font-medium uppercase tracking-wider text-surface-400 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded">
                        {sys.type === "higher"
                          ? lang === "fr" ? "Supérieur" : "Higher Education"
                          : lang === "fr" ? "Secondaire" : "Secondary"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || selected.length === 0}
              className="h-12 px-8 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-w-[200px]"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("edsys.saving", "Saving...")}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {selected.length > 0
                    ? t("edsys.continue", "Continue to dashboard")
                    : t("edsys.selectOne", "Select at least one system")}
                </>
              )}
            </button>
            <p className="text-xs text-surface-400">
              {t("edsys.helpText", "You can always change this later in Settings → Campus Website")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
