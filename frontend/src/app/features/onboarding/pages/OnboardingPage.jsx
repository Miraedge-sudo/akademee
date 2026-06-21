import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import api from "../../../core/api/axios";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import { useAuth } from "../../../core/hooks/useAuth";

const STEPS = [
  { num: 1, key: "logo" },
  { num: 2, key: "hero" },
  { num: 3, key: "content" },
  { num: 4, key: "review" },
];

const COLOR_PRESETS = [
  "#085041", "#1E40AF", "#7C3AED", "#B91C1C", "#B45309",
  "#0F766E", "#1D4ED8", "#047857", "#9D174D", "#374151",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { t, i18n } = useTranslation("onboarding");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [onboardingData, setOnboardingData] = useState({
    tagline: "",
    description: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SCHOOLS.ONBOARDING);
      if (response.data.success) {
        setOnboardingData((prev) => ({ ...prev, ...response.data.data }));
      }
    } catch (err) {
      console.error("Error loading onboarding data:", err);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    setError("");

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await api.post(API_ENDPOINTS.SCHOOLS.ONBOARDING_MEDIA, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        setOnboardingData((prev) => ({ ...prev, logoUrl: response.data.data.logoUrl }));
      }
    } catch (err) {
      setError(t("errors.logoUpload", "Error uploading logo"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingHero(true);
    setError("");

    const formData = new FormData();
    formData.append("heroImage", file);

    try {
      const response = await api.post(API_ENDPOINTS.SCHOOLS.ONBOARDING_MEDIA, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        setOnboardingData((prev) => ({ ...prev, heroImageUrl: response.data.data.heroImageUrl }));
      }
    } catch (err) {
      setError(t("errors.heroUpload", "Error uploading cover image"));
    } finally {
      setUploadingHero(false);
    }
  };

  const handleChange = (e) => {
    setOnboardingData({ ...onboardingData, [e.target.name]: e.target.value });
  };

  const handleColorChange = (hex) => {
    setOnboardingData((prev) => ({ ...prev, primaryColor: hex }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.put(API_ENDPOINTS.SCHOOLS.ONBOARDING, onboardingData);
      if (response.data.success) {
        const token = localStorage.getItem("token");
        if (token) {
          await login({ subdomain: "", email: user?.email || "", password: "" });
        }
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || t("errors.save", "Error saving"));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const skip = () => (step < 4 ? nextStep() : navigate("/dashboard"));

  const pc = onboardingData.primaryColor;

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-900">

      {/* ══ LEFT PANEL ══ */}
      <aside
        className="hidden lg:flex flex-col w-[300px] flex-shrink-0 sticky top-0 h-screen px-9 py-9 transition-colors duration-300"
        style={{ backgroundColor: pc }}
      >
        <div className="flex items-center gap-2.5 mb-11">
          <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="font-display text-lg text-white/90">Akademee</span>
        </div>

        <div className="mb-9">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-white/45 mb-2">
            {t("firstTimeSetup", "First time setup")}
          </p>
          <h2 className="font-display text-[24px] text-white leading-snug">
            {t("welcomeTitle1", "Let's build your")}
            <br />
            <em className="italic text-white/55">{t("welcomeTitle2", "campus website.")}</em>
          </h2>
        </div>

        <div className="flex flex-col gap-0.5 flex-1">
          {STEPS.map((s) => (
            <div key={s.num} className="flex items-center gap-3.5 py-2.5 px-3 relative">
              <div
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 border-2 transition-all ${
                  step > s.num
                    ? "bg-white/20 border-white/35 text-white"
                    : step === s.num
                    ? "bg-white border-white"
                    : "bg-transparent border-white/20 text-white/35"
                }`}
                style={step === s.num ? { color: pc } : {}}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <div>
                <div className={`text-[13px] font-medium ${step === s.num ? "text-white" : step > s.num ? "text-white/65" : "text-white/35"}`}>
                  {t(`steps.${s.key}.title`, s.key)}
                </div>
                <div className="text-[11px] text-white/25">
                  {t(`steps.${s.key}.desc`, "")}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11.5px] text-white/22 leading-relaxed">
          {t("editLaterNote", "You can edit all of this later in Settings → Campus Website")}
        </p>
      </aside>

      {/* ══ RIGHT PANEL ══ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-6 lg:px-10 h-[58px] bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 flex-shrink-0">
          <div className="flex-1 max-w-[280px]">
            <div className="flex justify-between text-xs text-surface-400 mb-1.5">
              <span>{t("stepLabel", "Step")} {step} {t("of", "of")} 4</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="h-1 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%`, backgroundColor: pc }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeLangToggles />
            <button
              onClick={skip}
              className="text-[13px] text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 px-3 py-1.5 rounded-md transition-colors"
            >
              {t("skipForNow", "Skip for now")} →
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-9 max-w-[640px]">

          {error && (
            <div className="mb-5 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── STEP 1 — Logo ── */}
          {step === 1 && (
            <div>
              <p className="text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: pc }}>
                {t("steps.logo.title", "School identity")}
              </p>
              <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                {t("logo.heading", "Your school logo")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                {t("logo.subtitle", "Upload your logo, or we'll generate one from your school's initials.")}
              </p>

              <label
                htmlFor="logo-upload"
                className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-surface-200 dark:border-surface-600 rounded-xl cursor-pointer hover:border-teal-400 transition-colors"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: onboardingData.logoUrl ? "transparent" : pc }}>
                  {onboardingData.logoUrl ? (
                    <img src={onboardingData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl font-bold text-white">
                      {(user?.schoolName || "SC").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  {uploadingLogo ? t("logo.uploading", "Uploading...") : t("logo.cta", "Click to upload your logo")}
                </span>
                <span className="text-xs text-surface-400">{t("logo.specs", "PNG, JPG or SVG · Max 2MB")}</span>
                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>

              <div className="flex items-start gap-2.5 mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-md">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-surface-400 leading-relaxed">
                  {t("logo.hint", "No logo yet? We'll use your school's initials and chosen colour as a placeholder.")}
                </p>
              </div>

              <button
                onClick={nextStep}
                className="w-full h-[46px] mt-7 text-white text-[15px] font-semibold rounded-md flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                style={{ backgroundColor: pc }}
              >
                {t("continue", "Continue")}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          )}

          {/* ── STEP 2 — Hero image ── */}
          {step === 2 && (
            <div>
              <p className="text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: pc }}>
                {t("steps.hero.title", "Photos")}
              </p>
              <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                {t("hero.heading", "Cover image")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                {t("hero.subtitle", "This will be the main banner of your campus website.")}
              </p>

              <label
                htmlFor="hero-upload"
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-surface-200 dark:border-surface-600 rounded-xl cursor-pointer hover:border-teal-400 transition-colors aspect-[21/9] overflow-hidden"
              >
                {onboardingData.heroImageUrl ? (
                  <img src={onboardingData.heroImageUrl} alt="Hero" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 text-surface-400">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                      {uploadingHero ? t("hero.uploading", "Uploading...") : t("hero.cta", "Add hero photo")}
                    </span>
                    <span className="text-xs text-surface-400">{t("hero.specs", "Recommended 1920×800px · Max 5MB")}</span>
                  </>
                )}
                <input id="hero-upload" type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
              </label>

              <div className="flex gap-2.5 mt-7">
                <button
                  onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
                  style={{ backgroundColor: pc }}
                >
                  {t("continue", "Continue")}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Content & Color ── */}
          {step === 3 && (
            <div>
              <p className="text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: pc }}>
                {t("steps.content.title", "About & content")}
              </p>
              <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                {t("content.heading", "Present your school")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                {t("content.subtitle", "Choose your brand colour and tell visitors about your school.")}
              </p>

              {/* Color picker */}
              <div className="mb-7">
                <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-2.5">
                  {t("content.colorLabel", "School primary colour")}
                </label>
                <div className="flex items-center gap-3.5 flex-wrap">
                  <div className="relative flex items-center gap-2.5 bg-white dark:bg-surface-800 border-[1.5px] border-surface-200 dark:border-surface-600 rounded-md px-3.5 py-2">
                    <label
                      htmlFor="color-picker"
                      className="w-7 h-7 rounded-md cursor-pointer flex-shrink-0"
                      style={{ backgroundColor: pc }}
                    />
                    <input
                      id="color-picker"
                      type="color"
                      value={pc}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-200 font-mono w-20">
                      {pc}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => handleColorChange(hex)}
                        className={`w-7 h-7 rounded-full flex-shrink-0 transition-transform hover:scale-110 ${
                          pc.toLowerCase() === hex.toLowerCase() ? "ring-2 ring-offset-2 ring-surface-800 dark:ring-surface-200 dark:ring-offset-surface-900" : ""
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("content.taglineLabel", "Tagline / Slogan")}
                </label>
                <input
                  name="tagline"
                  type="text"
                  value={onboardingData.tagline}
                  onChange={handleChange}
                  placeholder={t("content.taglinePlaceholder", "Shaping the leaders of tomorrow, today.")}
                  maxLength={80}
                  className="w-full h-11 px-3.5 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 transition-colors"
                />
              </div>

              <div className="mb-5">
                <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("content.descLabel", "School description")}
                </label>
                <textarea
                  name="description"
                  rows={5}
                  value={onboardingData.description}
                  onChange={handleChange}
                  placeholder={t("content.descPlaceholder", "Tell families what makes your school special...")}
                  className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-2.5 mt-7">
                <button
                  onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
                  style={{ backgroundColor: pc }}
                >
                  {t("continue", "Continue")}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4 — Review ── */}
          {step === 4 && (
            <div>
              <p className="text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: pc }}>
                {t("steps.review.title", "Preview & publish")}
              </p>
              <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                {t("review.heading", "Your site is ready 🎉")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                {t("review.subtitle", "Review your details before going live. You can edit everything later.")}
              </p>

              <div className="space-y-3 mb-7">
                <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-lg">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: onboardingData.logoUrl ? "transparent" : pc }}>
                    {onboardingData.logoUrl ? (
                      <img src={onboardingData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold font-display">
                        {(user?.schoolName || "SC").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100">{t("review.logo", "Logo")}</h3>
                    <p className="text-xs text-surface-400">{onboardingData.logoUrl ? t("review.uploaded", "Uploaded") : t("review.usingInitials", "Using initials placeholder")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-lg">
                  {onboardingData.heroImageUrl ? (
                    <img src={onboardingData.heroImageUrl} alt="Hero" className="w-20 h-12 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-12 rounded bg-surface-200 dark:bg-surface-700 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100">{t("review.coverImage", "Cover image")}</h3>
                    <p className="text-xs text-surface-400">{onboardingData.heroImageUrl ? t("review.uploaded", "Uploaded") : t("review.notSet", "Not set")}</p>
                  </div>
                </div>

                <div className="p-4 bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-lg">
                  <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 mb-1">{t("review.tagline", "Tagline")}</h3>
                  <p className="text-xs text-surface-400">{onboardingData.tagline || t("review.notSet", "Not set")}</p>
                </div>

                <div className="p-4 bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-lg">
                  <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 mb-2">{t("review.primaryColor", "Primary colour")}</h3>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md" style={{ backgroundColor: pc }} />
                    <span className="text-xs text-surface-400 font-mono">{pc}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: pc }}
                >
                  {loading ? (
                    t("review.saving", "Saving...")
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      {t("review.submit", "Finish & go to dashboard")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}