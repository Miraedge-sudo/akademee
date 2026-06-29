import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import { useAuth } from "../../../core/hooks/useAuth";
import {
  getOnboardingData,
  saveOnboardingData,
  uploadMedia,
} from "../../../core/api/websiteService";
import akademeeLogo from "../../../../assets/Logo.png";
import { ThemeContext } from "../../../core/context/ThemeContext";
import { buildSubdomainUrl } from "../../../core/utils/subdomainHelper";

const STEPS = [
  { num: 1, key: "identity" },
  { num: 2, key: "content" },
  { num: 3, key: "template" },
  { num: 4, key: "review" },
  { num: 5, key: "publish" },
];

const COLOR_PRESETS = [
  "#085041",
  "#1E40AF",
  "#7C3AED",
  "#B91C1C",
  "#B45309",
  "#0F766E",
  "#1D4ED8",
  "#047857",
  "#9D174D",
  "#374151",
];

const TEMPLATE_PREVIEWS = {
  modern: {
    name: "Modern",
    desc: "Split hero, gradient accents, stats band, gallery grid — contemporary & engaging",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect
          x="2"
          y="2"
          width="44"
          height="32"
          rx="3"
          className="stroke-surface-300 dark:stroke-surface-500 fill-white dark:fill-surface-800"
          strokeWidth="1.5"
        />
        <rect
          x="6"
          y="6"
          width="18"
          height="14"
          rx="1.5"
          className="fill-primary-100 dark:fill-primary-900/40"
        />
        <rect
          x="27"
          y="6"
          width="15"
          height="6"
          rx="1.5"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="27"
          y="14"
          width="15"
          height="2"
          rx="1"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="27"
          y="17.5"
          width="10"
          height="2"
          rx="1"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="6"
          y="22.5"
          width="36"
          height="1.5"
          rx="0.75"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="6"
          y="26"
          width="8"
          height="3"
          rx="1"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="16"
          y="26"
          width="8"
          height="3"
          rx="1"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="26"
          y="26"
          width="8"
          height="3"
          rx="1"
          className="fill-surface-200 dark:fill-surface-700"
        />
      </svg>
    ),
  },
  classic: {
    name: "Classic",
    desc: "Gold/ink tones, framed hero, marquee, boxed stats — traditional & trustworthy",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect
          x="2"
          y="2"
          width="44"
          height="32"
          rx="3"
          className="stroke-surface-300 dark:stroke-surface-500 fill-amber-50 dark:fill-surface-800"
          strokeWidth="1.5"
        />
        <rect
          x="6"
          y="6"
          width="36"
          height="14"
          rx="1.5"
          className="fill-amber-100 dark:fill-amber-900/20 stroke-amber-300 dark:stroke-amber-700"
          strokeWidth="0.75"
        />
        <rect
          x="10"
          y="9"
          width="28"
          height="3"
          rx="1"
          className="fill-amber-800/30 dark:fill-amber-400/30"
        />
        <rect
          x="14"
          y="14"
          width="20"
          height="1.5"
          rx="0.75"
          className="fill-surface-300 dark:fill-surface-600"
        />
        <rect
          x="6"
          y="22.5"
          width="36"
          height="1.5"
          rx="0.75"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="6"
          y="26.5"
          width="10"
          height="4.5"
          rx="1"
          className="fill-amber-200/50 dark:fill-amber-800/30 stroke-amber-300/50 dark:stroke-amber-700/30"
          strokeWidth="0.5"
        />
        <rect
          x="18.5"
          y="26.5"
          width="10"
          height="4.5"
          rx="1"
          className="fill-amber-200/50 dark:fill-amber-800/30 stroke-amber-300/50 dark:stroke-amber-700/30"
          strokeWidth="0.5"
        />
        <rect
          x="31"
          y="26.5"
          width="10"
          height="4.5"
          rx="1"
          className="fill-amber-200/50 dark:fill-amber-800/30 stroke-amber-300/50 dark:stroke-amber-700/30"
          strokeWidth="0.5"
        />
      </svg>
    ),
  },
  minimal: {
    name: "Minimal",
    desc: "Clean whitespace, centered type, subtle borders, mono accents — sleek & fast",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect
          x="2"
          y="2"
          width="44"
          height="32"
          rx="3"
          className="stroke-surface-300 dark:stroke-surface-500 fill-white dark:fill-surface-800"
          strokeWidth="1.5"
        />
        <rect
          x="14"
          y="7"
          width="20"
          height="3"
          rx="1.5"
          className="fill-surface-800/20 dark:fill-surface-100/20"
        />
        <rect
          x="18"
          y="12"
          width="12"
          height="1.5"
          rx="0.75"
          className="fill-surface-300 dark:fill-surface-600"
        />
        <rect
          x="8"
          y="17"
          width="32"
          height="0.75"
          rx="0.375"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <circle
          cx="24"
          cy="25"
          r="4"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="10"
          y="23"
          width="6"
          height="4"
          rx="1"
          className="fill-surface-200 dark:fill-surface-700"
        />
        <rect
          x="32"
          y="23"
          width="6"
          height="4"
          rx="1"
          className="fill-surface-200 dark:fill-surface-700"
        />
      </svg>
    ),
  },
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("onboarding");
  const { user } = useAuth();
  const { updatePrimaryColor } = useContext(ThemeContext);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState({ logo: false, hero: false });
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);

  const [data, setData] = useState({
    tagline: "",
    description: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    templateCode: "modern",
    websiteStats: {},
    websiteValues: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await getOnboardingData();
      setData({
        tagline: result.tagline || "",
        description: result.websiteDescription || "",
        primaryColor: result.primaryColor || "#085041",
        logoUrl: result.logoUrl || "",
        heroImageUrl: result.heroImageUrl || "",
        templateCode: result.templateCode || "modern",
        websiteStats: result.websiteStats || {},
        websiteValues: Array.isArray(result.websiteValues)
          ? result.websiteValues
          : [],

      });
    } catch (err) {
      console.error("Error loading onboarding data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleColorChange = (hex) => {
    setData((prev) => ({ ...prev, primaryColor: hex }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, logo: true }));
    setError("");
    try {
      const result = await uploadMedia(file, "logo");
      if (result?.logoUrl || result?.url) {
        setData((prev) => ({ ...prev, logoUrl: result.logoUrl || result.url }));
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      setError(
        err.response?.data?.message || err.message || "Error uploading logo",
      );
    } finally {
      setUploading((prev) => ({ ...prev, logo: false }));
    }
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, hero: true }));
    setError("");
    try {
      const result = await uploadMedia(file, "hero");
      if (result?.heroImageUrl || result?.url) {
        setData((prev) => ({
          ...prev,
          heroImageUrl: result.heroImageUrl || result.url,
        }));
      }
    } catch (err) {
      console.error("Hero upload error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error uploading cover image",
      );
    } finally {
      setUploading((prev) => ({ ...prev, hero: false }));
    }
  };

  // Step 4: save and go to preview step
  const handleSave = async () => {
    setSaving(true);
    setError("");

    let primaryColor = data.primaryColor;
    if (!primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      primaryColor = "#085041";
    }

    const payload = {
      tagline: data.tagline,
      websiteDescription: data.description,
      primaryColor,
      templateCode: data.templateCode,
      websiteStats: data.websiteStats,
      websiteValues: data.websiteValues,
      onboardingCompleted: true,
    };

    try {
      const response = await saveOnboardingData(payload);
      if (response.success) {
        // Save color
        localStorage.setItem("akademee-primary-color", primaryColor);
        document.documentElement.style.setProperty(
          "--primary-color",
          primaryColor,
        );
        updatePrimaryColor(primaryColor);
        // Go to step 5 (preview)
        nextStep();
      } else {
        setError(response.message || "Error saving configuration");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error saving configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  // Step 5: publish + redirect to live site
  const handlePublishAndGoLive = async () => {
    setSaving(true);
    setError("");

    let primaryColor = data.primaryColor;
    if (!primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      primaryColor = "#085041";
    }

    const payload = {
      tagline: data.tagline,
      websiteDescription: data.description,
      primaryColor,
      templateCode: data.templateCode,
      websiteStats: data.websiteStats,
      websiteValues: data.websiteValues,
      onboardingCompleted: true,
      websitePublished: true,
    };

    try {
      const response = await saveOnboardingData(payload);
      if (response.success) {
        // Save color synchronously before navigation
        localStorage.setItem("akademee-primary-color", primaryColor);
        document.documentElement.style.setProperty(
          "--primary-color",
          primaryColor,
        );
        updatePrimaryColor(primaryColor);

        // Redirect to the live site on the school's subdomain
        const schoolSubdomain =
          user?.subdomain || localStorage.getItem("akademee-subdomain");
        const token = localStorage.getItem("token");
        if (schoolSubdomain) {
          const liveUrl = buildSubdomainUrl(
            schoolSubdomain,
            `/site${token ? `?token=${encodeURIComponent(token)}` : ""}`,
          );
          window.location.href = liveUrl;
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        setError(response.message || "Error saving configuration");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error saving configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const skip = () => (step < 5 ? nextStep() : navigate("/dashboard"));

  const pc = data.primaryColor;
  const initials = (user?.schoolName || "SC")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
          <p className="text-sm text-surface-400">{t("Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* ══ LEFT PANEL — Progress sidebar ══ */}
      <aside
        className="hidden lg:flex flex-col w-[280px] flex-shrink-0 sticky top-0 h-screen px-8 py-9 transition-colors duration-300"
        style={{ backgroundColor: pc }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-10">
          <img
            src={akademeeLogo}
            alt="Akademee"
            className="w-8 h-8 object-contain"
          />
          <span className="font-display text-lg text-white/90">Akademee</span>
        </div>

        {/* Welcome */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-white/45 mb-2">
            {t("firstTimeSetup", "First time setup")}
          </p>
          <h2 className="font-display text-[22px] text-white leading-snug">
            {t("welcomeTitle1", "Let's build your")}
            <br />
            <em className="italic text-white/55">
              {t("welcomeTitle2", "campus website.")}
            </em>
          </h2>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-1 flex-1">
          {STEPS.map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                }}
              >
                <div
                  className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 border-2 transition-all ${
                    isDone
                      ? "bg-white/20 border-white/35 text-white"
                      : isActive
                        ? "bg-white border-white"
                        : "bg-transparent border-white/20 text-white/35"
                  }`}
                  style={isActive ? { color: pc } : {}}
                >
                  {isDone ? "✓" : s.num}
                </div>
                <div>
                  <div
                    className={`text-[13px] font-medium ${isActive ? "text-white" : isDone ? "text-white/65" : "text-white/35"}`}
                  >
                    {t(
                      `steps.${s.key}.title`,
                      {
                        identity: "School identity",
                        content: "About & content",
                        template: "Template",
                        review: "Review",
                        publish: "Preview & publish",
                      }[s.key] || s.key,
                    )}
                  </div>
                  <div className="text-[11px] text-white/25">
                    {t(`steps.${s.key}.desc`, "")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11.5px] text-white/22 leading-relaxed mt-auto">
          {t(
            "editLaterNote",
            "You can edit all of this later in Settings → Campus Website",
          )}
        </p>
      </aside>

      {/* ══ RIGHT PANEL — Content ══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 lg:px-10 h-[58px] bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 flex-shrink-0">
          <div className="flex-1 max-w-[280px]">
            <div className="flex justify-between text-xs text-surface-400 mb-1.5">
              <span>
                {t("stepLabel", "Step")} {step} {t("of", "of")} 5
              </span>
              <span>{Math.round((step / 5) * 100)}%</span>
            </div>
            <div className="h-1 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%`, backgroundColor: pc }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeLangToggles />
            <button
              onClick={skip}
              className="text-[13px] text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 px-3 py-1.5 rounded-md transition-colors"
            >
              {step < 4
                ? `${t("skipForNow", "Skip for now")} →`
                : t("skipForNow", "Skip for now")}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-9 max-w-[640px] mx-auto w-full">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="w-4 h-4 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {/* ── STEP 1 — Identity (Logo + Color) ── */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Logo */}
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <p
                  className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
                  style={{ color: pc }}
                >
                  {t("steps.logo.title", "School identity")}
                </p>
                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                  {t("logo.heading", "Your school logo")}
                </h1>
                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
                  {t(
                    "logo.subtitle",
                    "Upload your logo, or we'll generate one from your school's initials.",
                  )}
                </p>

                <div className="flex items-center gap-5">
                  <label
                    htmlFor="onb-logo-upload"
                    className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                    style={{
                      backgroundColor: data.logoUrl ? "transparent" : pc + "15",
                    }}
                  >
                    {data.logoUrl ? (
                      <img
                        src={data.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className="font-display text-2xl font-bold"
                        style={{ color: pc }}
                      >
                        {initials}
                      </span>
                    )}
                    <input
                      ref={logoInputRef}
                      id="onb-logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading.logo}
                      className="h-9 px-4 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {uploading.logo
                        ? t("logo.uploading", "Uploading...")
                        : t("logo.cta", "Upload logo")}
                    </button>
                    {data.logoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({ ...prev, logoUrl: "" }))
                        }
                        className="h-9 px-4 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        {t("Remove")}
                      </button>
                    )}
                    <p className="text-[11px] text-surface-400">
                      {t("logo.specs", "PNG, JPG or SVG · Max 2MB")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Color */}
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
                  {t("content.colorLabel", "School primary colour")}
                </h2>
                <p className="text-xs text-surface-400 mb-4">
                  This colour will be used for buttons, links, and accents
                  across your website.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative flex items-center gap-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded-lg px-3.5 py-2.5">
                    <label
                      htmlFor="onb-color-picker"
                      className="w-8 h-8 rounded-lg cursor-pointer flex-shrink-0 border border-white/20"
                      style={{ backgroundColor: pc }}
                    />
                    <input
                      id="onb-color-picker"
                      type="color"
                      value={pc}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-200 font-mono min-w-[4.5rem]">
                      {pc}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => handleColorChange(hex)}
                        className={`w-7 h-7 rounded-full flex-shrink-0 transition-all hover:scale-110 ${
                          pc.toLowerCase() === hex.toLowerCase()
                            ? "ring-2 ring-offset-2 ring-surface-800 dark:ring-surface-200 dark:ring-offset-surface-900 scale-110"
                            : ""
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-surface-400 leading-relaxed">
                  {t(
                    "logo.hint",
                    "No logo yet? We'll use your school's initials and chosen colour as a placeholder.",
                  )}
                </p>
              </div>

              <button
                onClick={nextStep}
                className="w-full h-[46px] text-white text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                style={{ backgroundColor: pc }}
              >
                {t("continue", "Continue")}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-[17px] h-[17px]"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          )}

          {/* ── STEP 2 — Content (Tagline + Description + Hero) ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <p
                  className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
                  style={{ color: pc }}
                >
                  {t("steps.hero.title", "Content")}
                </p>
                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                  {t("content.heading", "Present your school")}
                </h1>
                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                  {t(
                    "content.subtitle",
                    "Choose your brand colour and tell visitors about your school.",
                  )}
                </p>

                {/* Tagline */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("content.taglineLabel", "Tagline / Slogan")}
                  </label>
                  <input
                    name="tagline"
                    type="text"
                    value={data.tagline}
                    onChange={handleChange}
                    placeholder={t(
                      "content.taglinePlaceholder",
                      "Shaping the leaders of tomorrow, today.",
                    )}
                    maxLength={80}
                    className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors"
                  />
                  <p className="text-[11px] text-surface-400 mt-1 text-right">
                    {data.tagline.length}/80
                  </p>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("content.descLabel", "School description")}
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={data.description}
                    onChange={handleChange}
                    placeholder={t(
                      "content.descPlaceholder",
                      "Tell families what makes your school special...",
                    )}
                    className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors resize-none"
                  />
                </div>

                {/* Hero image */}
                <div>
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("hero.heading", "Cover image")}
                  </label>
                  <p className="text-[11px] text-surface-400 mb-3">
                    {t("hero.specs", "Recommended 1920×800px · Max 5MB")}
                  </p>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="onb-hero-upload"
                      className="flex-shrink-0 w-36 aspect-[21/9] rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                    >
                      {data.heroImageUrl ? (
                        <img
                          src={data.heroImageUrl}
                          alt="Hero"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 p-2">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            className="w-5 h-5 text-surface-400"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[10px] text-surface-400 text-center">
                            {uploading.hero
                              ? t("hero.uploading", "Uploading...")
                              : t("hero.cta", "Add hero photo")}
                          </span>
                        </div>
                      )}
                      <input
                        ref={heroInputRef}
                        id="onb-hero-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleHeroUpload}
                        className="hidden"
                      />
                    </label>
                    {data.heroImageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({ ...prev, heroImageUrl: "" }))
                        }
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        {t("Remove")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-3.5 h-3.5"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  style={{ backgroundColor: pc }}
                >
                  {t("continue", "Continue")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Template ── */}
          {step === 3 && (
            <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
              <p
                className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
                style={{ color: pc }}
              >
                Template
              </p>
              <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                Choose your template
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
                Pick a design for your campus website. You can change this
                anytime in Settings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {Object.entries(TEMPLATE_PREVIEWS).map(([code, template]) => {
                  const selected = data.templateCode === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() =>
                        setData((prev) => ({ ...prev, templateCode: code }))
                      }
                      className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        selected
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/15 shadow-sm"
                          : "border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-750"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-3 h-3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-700">
                        {template.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                          {template.name}
                        </div>
                        <div className="text-xs text-surface-400 mt-0.5 leading-relaxed">
                          {template.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-3.5 h-3.5"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  style={{ backgroundColor: pc }}
                >
                  {t("continue", "Continue")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4 — Review & Finish ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <p
                  className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
                  style={{ color: pc }}
                >
                  {t("steps.review.title", "Review")}
                </p>
                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                  {t("review.heading", "Your site is ready 🎉")}
                </h1>
                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
                  {t(
                    "review.subtitle",
                    "Review your details before going live. You can edit everything later.",
                  )}
                </p>

                {/* Summary card */}
                <div
                  className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                  style={{ borderLeftWidth: "4px", borderLeftColor: pc }}
                >
                  <div className="p-5 bg-white dark:bg-surface-800">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div className="text-surface-500">
                        {t("review.logo", "Logo")}
                      </div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium">
                        {data.logoUrl
                          ? t("review.uploaded", "Uploaded")
                          : t(
                              "review.usingInitials",
                              "Using initials placeholder",
                            )}
                      </div>

                      <div className="text-surface-500">
                        {t("review.coverImage", "Cover image")}
                      </div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium">
                        {data.heroImageUrl
                          ? t("review.uploaded", "Uploaded")
                          : t("review.notSet", "Not set")}
                      </div>

                      <div className="text-surface-500">
                        {t("review.tagline", "Tagline")}
                      </div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium truncate">
                        {data.tagline || t("review.notSet", "—")}
                      </div>

                      <div className="text-surface-500">
                        {t("review.primaryColor", "Primary colour")}
                      </div>
                      <div className="flex items-center gap-2 text-surface-800 dark:text-surface-100 font-medium">
                        <span
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: pc }}
                        />
                        {pc}
                      </div>

                      <div className="text-surface-500">Template</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium">
                        {TEMPLATE_PREVIEWS[data.templateCode]?.name ||
                          data.templateCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-0.5">
                    You can edit everything later
                  </p>
                  <p className="text-sm text-surface-400">
                    Go to Settings → Campus Website to add stats, values,
                    gallery photos, and more.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-3.5 h-3.5"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: pc }}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {t("review.saving", "Saving...")}
                    </span>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t("review.submit", "Continue to preview")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5 — Preview & Publish ── */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <p
                  className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
                  style={{ color: pc }}
                >
                  {t("steps.publish.title", "Preview & publish")}
                </p>
                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                  Preview your campus website
                </h1>
                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-5">
                  Take a look at your site below. When you're happy, click
                  "Publish" to make it live.
                </p>

                {/* Mini preview card */}
                <div
                  className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                  style={{ borderLeftWidth: "4px", borderLeftColor: pc }}
                >
                  {/* Hero preview */}
                  <div
                    className="relative h-[200px] flex items-end overflow-hidden"
                    style={{
                      background: data.heroImageUrl
                        ? `url(${data.heroImageUrl}) center/cover`
                        : `linear-gradient(135deg, ${pc}, ${pc}88)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="relative z-10 p-6 flex items-center gap-4">
                      {/* Logo / initials */}
                      <div
                        className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white/30"
                        style={{
                          background: data.logoUrl
                            ? `url(${data.logoUrl}) center/cover`
                            : pc,
                        }}
                      >
                        {!data.logoUrl && (
                          <span className="w-full h-full flex items-center justify-center font-display font-bold text-lg text-white">
                            {initials}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-display text-lg font-bold text-white drop-shadow-sm">
                          {user?.schoolName || "Your School"}
                        </div>
                        {data.tagline && (
                          <div className="text-sm text-white/80 mt-0.5 drop-shadow-sm">
                            {data.tagline}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div className="p-5 bg-white dark:bg-surface-800">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div className="text-surface-500">Template</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium">
                        {TEMPLATE_PREVIEWS[data.templateCode]?.name ||
                          data.templateCode}
                      </div>
                      <div className="text-surface-500">Colour</div>
                      <div className="flex items-center gap-2 text-surface-800 dark:text-surface-100 font-medium">
                        <span
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: pc }}
                        />
                        {pc}
                      </div>
                      {data.description && (
                        <>
                          <div className="text-surface-500">Description</div>
                          <div className="text-surface-800 dark:text-surface-100 text-surface-500 line-clamp-2">
                            {data.description}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-surface-400 text-center mt-4 flex items-center justify-center gap-1.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-4 h-4"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  You can edit everything later in Settings → Campus Website
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-3.5 h-3.5"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button
                  onClick={handlePublishAndGoLive}
                  disabled={saving}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: pc }}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Publishing...
                    </span>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        className="w-4 h-4"
                      >
                        <path d="M22 2 11 13" />
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      Publish my site
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
