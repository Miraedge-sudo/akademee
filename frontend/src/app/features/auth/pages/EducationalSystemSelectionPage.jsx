import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { useEducationalSystems } from "../../../core/context/EducationalSystemContext";
import akademeeLogo from "../../../../assets/Logo.png";
import {
  FiBook,
  FiCheck,
  FiXCircle,
  FiSend,
  FiLayers,
  FiTool,
  FiCheckSquare,
} from "react-icons/fi";

const SYSTEMS = [
  {
    id: "anglophone_general",
    name: "Anglophone General",
    nameFr: "Général Anglophone",
    description: "GCE O-Level & A-Level — 5+2 years",
    descriptionFr: "GCE O-Level & A-Level — 5+2 ans",
    type: "secondary",
    color: "blue",
    dot: "bg-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    icon: "book",
  },
  {
    id: "francophone_general",
    name: "Francophone General",
    nameFr: "Général Francophone",
    description: "BEPC, Probatoire & Baccalauréat — 4+3 years",
    descriptionFr: "BEPC, Probatoire & Baccalauréat — 4+3 ans",
    type: "secondary",
    color: "amber",
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    icon: "layers",
  },
  {
    id: "anglophone_technical",
    name: "Anglophone Technical",
    nameFr: "Technique Anglophone",
    description: "TVEE IL & AL — Technical & Vocational",
    descriptionFr: "TVEE IL & AL — Technique & Professionnel",
    type: "secondary",
    color: "cyan",
    dot: "bg-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
    icon: "tool",
  },
  {
    id: "francophone_technical",
    name: "Francophone Technical",
    nameFr: "Technique Francophone",
    description: "CAP, Brevet & Baccalauréat Technique — 4+3 years",
    descriptionFr: "CAP, Brevet & Baccalauréat Technique — 4+3 ans",
    type: "secondary",
    color: "purple",
    dot: "bg-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500",
    text: "text-purple-600 dark:text-purple-400",
    icon: "checkSquare",
  },
  {
    id: "university",
    name: "University",
    nameFr: "Université",
    description: "LMD — Licence, Master, Doctorate",
    descriptionFr: "LMD — Licence, Master, Doctorat",
    type: "higher",
    color: "emerald",
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "send",
  },
];

const SYSTEM_ICONS = {
  book: <FiBook className="w-5 h-5" />,
  layers: <FiLayers className="w-5 h-5" />,
  tool: <FiTool className="w-5 h-5" />,
  checkSquare: <FiCheckSquare className="w-5 h-5" />,
  send: <FiSend className="w-5 h-5" />,
};

export default function EducationalSystemSelectionPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { selectedSystems, updateSelectedSystems, loading } =
    useEducationalSystems();

  const [localSelected, setLocalSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && selectedSystems) {
      setLocalSelected(selectedSystems);
    }
  }, [selectedSystems, loading]);

  const toggle = (id) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
    setError("");
  };

  const handleSave = async () => {
    if (localSelected.length === 0) {
      setError("Please select at least one educational system");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateSelectedSystems(localSelected);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Error saving selection");
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
              <FiBook className="w-7 h-7 text-primary-700 dark:text-primary-300" />
            </div>
            <h1 className="font-display text-3xl font-bold text-surface-800 dark:text-surface-100 mb-2">
              {t("edsys.title", "Choose your educational systems")}
            </h1>
            <p className="text-surface-500 text-base max-w-md mx-auto">
              {t(
                "edsys.subtitle",
                "Select the educational system(s) your school offers. You can select multiple.",
              )}
            </p>
          </div>

          {/* Systems Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {SYSTEMS.map((sys) => {
              const isSelected = localSelected.includes(sys.id);
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => toggle(sys.id)}
                  className={`relative group p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? `${sys.border} ${sys.bg} shadow-md shadow-${sys.color}-500/10`
                      : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600 hover:shadow-sm"
                  }`}
                >
                  {/* Selected badge */}
                  {isSelected && (
                    <div
                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-surface-800 ${sys.border} border-2 flex items-center justify-center shadow-sm`}
                    >
                      <span className={`${sys.dot} w-3 h-3 rounded-full`} />
                    </div>
                  )}

                  <div className="flex items-start gap-3.5">
                    {/* System icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isSelected
                          ? `bg-white dark:bg-surface-800 ${sys.text} shadow-sm ring-1 ring-black/5 dark:ring-white/10`
                          : "bg-surface-100 dark:bg-surface-700 text-surface-400 group-hover:bg-surface-200 dark:group-hover:bg-surface-600"
                      }`}
                    >
                      {SYSTEM_ICONS[sys.icon]}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      {/* System name with colored dot */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isSelected ? sys.dot : "bg-surface-300 dark:bg-surface-600"
                          }`}
                        />
                        <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                          {lang === "fr" ? sys.nameFr : sys.name}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="text-xs text-surface-400 leading-relaxed pl-4">
                        {lang === "fr" ? sys.descriptionFr : sys.description}
                      </div>

                      {/* Type badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? `${sys.bg} ${sys.text}`
                            : "text-surface-400 bg-surface-100 dark:bg-surface-700"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isSelected
                              ? sys.dot
                              : "bg-surface-400"
                          }`}
                        />
                        {sys.type === "higher"
                          ? lang === "fr"
                            ? "Supérieur"
                            : "Higher Education"
                          : lang === "fr"
                            ? "Secondaire"
                            : "Secondary"}
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
              <FiXCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || localSelected.length === 0}
              className="h-12 px-8 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-w-[200px]"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("edsys.saving", "Saving...")}
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" strokeWidth={2.2} />
                  {localSelected.length > 0
                    ? t("edsys.continue", "Continue to dashboard")
                    : t("edsys.selectOne", "Select at least one system")}
                </>
              )}
            </button>
            <p className="text-xs text-surface-400">
              {t(
                "edsys.helpText",
                "You can always change this later in Settings → Campus Website",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
