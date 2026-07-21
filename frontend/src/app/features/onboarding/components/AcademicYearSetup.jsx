import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiCalendar, FiArrowRight } from "react-icons/fi";
import { createAcademicYear } from "../../../core/api/academicYearService";
import toast from "react-hot-toast";

export default function AcademicYearSetup({ onComplete, onBack }) {
  const { i18n } = useTranslation("onboarding");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const setDefaults = useCallback(() => {
    const now = new Date();
    const yr = now.getFullYear();
    setFormData({
      name: `${yr} – ${yr + 1}`,
      startDate: `${yr}-09-01`,
      endDate: `${yr + 1}-06-30`,
    });
  }, []);

  useEffect(() => {
    setDefaults();
  }, [setDefaults]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = lang === "fr" ? "Le nom est requis" : "Year name is required";
    }
    if (!formData.startDate) {
      errs.startDate =
        lang === "fr" ? "La date de début est requise" : "Start date is required";
    }
    if (!formData.endDate) {
      errs.endDate =
        lang === "fr" ? "La date de fin est requise" : "End date is required";
    }
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      errs.endDate =
        lang === "fr"
          ? "La date de fin doit être après la date de début"
          : "End date must be after start date";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      await createAcademicYear(payload);

      setShowSuccess(true);

      setTimeout(() => {
        // Force full page reload to re-initialize YearContext
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (lang === "fr" ? "Erreur lors de la création" : "Failed to create academic year");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-teal-50 dark:from-surface-900 dark:to-teal-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-teal-900 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-display text-xl text-teal-900 dark:text-teal-100 font-semibold">
            Akademee
          </span>
        </div>

        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
              <FiCalendar className="w-7 h-7 text-teal-700 dark:text-teal-300" />
            </div>
            <h1 className="font-display text-2xl font-bold text-surface-800 dark:text-surface-100 mb-2">
              {lang === "fr" ? "Créez votre année scolaire" : "Create your academic year"}
            </h1>
            <p className="text-sm text-surface-400 leading-relaxed">
              {lang === "fr"
                ? "Sans année scolaire, vous ne pouvez pas accéder à la plateforme."
                : "Without an academic year, you cannot access the platform."}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Year Name */}
            <div>
              <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
                {lang === "fr" ? "Nom de l'année" : "Year name"} <span className="text-teal-600">*</span>
              </label>
              <input
                type="text"
                className={`w-full h-12 px-4 rounded-xl border-2 font-sans text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 outline-none transition-all ${
                  errors.name
                    ? "border-red-400 ring-4 ring-red-500/10"
                    : "border-surface-200 dark:border-surface-600 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                }`}
                placeholder="e.g. 2025 – 2026"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
                  {lang === "fr" ? "Date de début" : "Start date"} <span className="text-teal-600">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full h-12 px-4 rounded-xl border-2 font-sans text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 outline-none transition-all ${
                    errors.startDate
                      ? "border-red-400 ring-4 ring-red-500/10"
                      : "border-surface-200 dark:border-surface-600 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  }`}
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
                  {lang === "fr" ? "Date de fin" : "End date"} <span className="text-teal-600">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full h-12 px-4 rounded-xl border-2 font-sans text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 outline-none transition-all ${
                    errors.endDate
                      ? "border-red-400 ring-4 ring-red-500/10"
                      : "border-surface-200 dark:border-surface-600 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  }`}
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                />
                {errors.endDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Hint */}
            <p className="text-xs text-surface-400 leading-relaxed bg-surface-50 dark:bg-surface-900 p-3 rounded-lg">
              {lang === "fr"
                ? "Vous pourrez configurer les trimestres, périodes et systèmes éducatifs plus tard dans Paramètres → Années scolaires."
                : "You can configure terms, periods and educational systems later in Settings → Academic Years."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-surface-100 dark:border-surface-700">
            {onBack ? (
              <button
                className="h-11 px-5 rounded-xl font-sans text-sm font-semibold cursor-pointer transition-all bg-white text-surface-600 border-2 border-surface-200 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-600 dark:hover:bg-surface-700"
                onClick={onBack}
              >
                {lang === "fr" ? "Retour" : "Back"}
              </button>
            ) : (
              <div />
            )}
            <button
              className="flex items-center gap-2.5 h-11 px-6 rounded-xl font-sans text-sm font-bold cursor-pointer transition-all bg-teal-900 text-white shadow-lg shadow-teal-900/20 hover:bg-teal-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {lang === "fr" ? "Création..." : "Creating..."}
                </span>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  {lang === "fr" ? "Créer & continuer" : "Create & continue"}
                  <FiArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-10 text-center max-w-sm w-[90%] animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-teal-700 dark:text-teal-300" />
            </div>
            <h2 className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
              {lang === "fr" ? "Année créée !" : "Year created!"}
            </h2>
            <p className="text-sm text-surface-400 mb-1">{formData.name}</p>
            <p className="text-xs text-surface-400">
              {lang === "fr"
                ? "Redirection vers le tableau de bord..."
                : "Redirecting to dashboard..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
