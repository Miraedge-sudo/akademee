import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { getOnboardingData, saveOnboardingData, uploadMedia } from "../../../core/api/websiteService";

const COLOR_PRESETS = [
  "#085041", "#1E40AF", "#7C3AED", "#B91C1C", "#B45309",
  "#0F766E", "#1D4ED8", "#047857", "#9D174D", "#374151",
];

const TEMPLATE_PREVIEWS = {
  modern: {
    name: "Modern",
    desc: "Split hero, gradient accents, stats band, gallery grid — contemporary & engaging",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect x="2" y="2" width="44" height="32" rx="3" className="stroke-surface-300 dark:stroke-surface-500 fill-white dark:fill-surface-800" strokeWidth="1.5" />
        <rect x="6" y="6" width="18" height="14" rx="1.5" className="fill-primary-100 dark:fill-primary-900/40" />
        <rect x="27" y="6" width="15" height="6" rx="1.5" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="27" y="14" width="15" height="2" rx="1" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="27" y="17.5" width="10" height="2" rx="1" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="6" y="22.5" width="36" height="1.5" rx="0.75" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="6" y="26" width="8" height="3" rx="1" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="16" y="26" width="8" height="3" rx="1" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="26" y="26" width="8" height="3" rx="1" className="fill-surface-200 dark:fill-surface-700" />
      </svg>
    ),
  },
  classic: {
    name: "Classic",
    desc: "Gold/ink tones, framed hero, marquee, boxed stats — traditional & trustworthy",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect x="2" y="2" width="44" height="32" rx="3" className="stroke-surface-300 dark:stroke-surface-500 fill-amber-50 dark:fill-surface-800" strokeWidth="1.5" />
        <rect x="6" y="6" width="36" height="14" rx="1.5" className="fill-amber-100 dark:fill-amber-900/20 stroke-amber-300 dark:stroke-amber-700" strokeWidth="0.75" />
        <rect x="10" y="9" width="28" height="3" rx="1" className="fill-amber-800/30 dark:fill-amber-400/30" />
        <rect x="14" y="14" width="20" height="1.5" rx="0.75" className="fill-surface-300 dark:fill-surface-600" />
        <rect x="6" y="22.5" width="36" height="1.5" rx="0.75" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="6" y="26.5" width="10" height="4.5" rx="1" className="fill-amber-200/50 dark:fill-amber-800/30 stroke-amber-300/50 dark:stroke-amber-700/30" strokeWidth="0.5" />
        <rect x="18.5" y="26.5" width="10" height="4.5" rx="1" className="fill-amber-200/50 dark:fill-amber-800/30 stroke-amber-300/50 dark:stroke-amber-700/30" strokeWidth="0.5" />
        <rect x="31" y="26.5" width="10" height="4.5" rx="1" className="fill-amber-200/50 dark:fill-amber-800/30 stroke-amber-300/50 dark:stroke-amber-700/30" strokeWidth="0.5" />
      </svg>
    ),
  },
  minimal: {
    name: "Minimal",
    desc: "Clean whitespace, centered type, subtle borders, mono accents — sleek & fast",
    icon: (
      <svg viewBox="0 0 48 36" fill="none" className="w-full h-full">
        <rect x="2" y="2" width="44" height="32" rx="3" className="stroke-surface-300 dark:stroke-surface-500 fill-white dark:fill-surface-800" strokeWidth="1.5" />
        <rect x="14" y="7" width="20" height="3" rx="1.5" className="fill-surface-800/20 dark:fill-surface-100/20" />
        <rect x="18" y="12" width="12" height="1.5" rx="0.75" className="fill-surface-300 dark:fill-surface-600" />
        <rect x="8" y="17" width="32" height="0.75" rx="0.375" className="fill-surface-200 dark:fill-surface-700" />
        <circle cx="24" cy="25" r="4" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="10" y="23" width="6" height="4" rx="1" className="fill-surface-200 dark:fill-surface-700" />
        <rect x="32" y="23" width="6" height="4" rx="1" className="fill-surface-200 dark:fill-surface-700" />
      </svg>
    ),
  },
};

export default function WebsiteSettingsPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { updatePrimaryColor } = useTheme();

  const [data, setData] = useState({
    tagline: "",
    description: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    templateCode: "modern",
    websiteStats: { studentsEnrolled: "", teachers: "", classes: "" },
    websiteValues: [],
    websitePublished: false,
  });
  const [originalData, setOriginalData] = useState(null);
  const [activeTab, setActiveTab] = useState("identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, hero: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newValue, setNewValue] = useState("");
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);

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
        websiteStats: {
          studentsEnrolled: result.websiteStats?.studentsEnrolled?.toString() || "",
          teachers: result.websiteStats?.teachers?.toString() || "",
          classes: result.websiteStats?.classes?.toString() || "",
        },
        websiteValues: Array.isArray(result.websiteValues) ? result.websiteValues : [],
        websitePublished: result.websitePublished || false,
      });
      setOriginalData(result);
    } catch (err) {
      console.error("Error loading website data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setSuccess("");
  };

  const handleColorChange = (hex) => {
    setData((prev) => ({ ...prev, primaryColor: hex }));
  };

  const handleStatChange = (field, value) => {
    setData((prev) => ({
      ...prev,
      websiteStats: { ...prev.websiteStats, [field]: value },
    }));
  };

  const handleAddValue = () => {
    const val = newValue.trim();
    if (!val) return;
    setData((prev) => ({
      ...prev,
      websiteValues: [...prev.websiteValues, val],
    }));
    setNewValue("");
  };

  const handleRemoveValue = (index) => {
    setData((prev) => ({
      ...prev,
      websiteValues: prev.websiteValues.filter((_, i) => i !== index),
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddValue();
    }
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
      const errorMsg = err.response?.data?.message || err.message || "Error uploading logo";
      setError(errorMsg);
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
        setData((prev) => ({ ...prev, heroImageUrl: result.heroImageUrl || result.url }));
      }
    } catch (err) {
      console.error("Hero upload error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Error uploading cover image";
      setError(errorMsg);
    } finally {
      setUploading((prev) => ({ ...prev, hero: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    // Validate primary color format
    let primaryColor = data.primaryColor;
    if (!primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      primaryColor = "#085041"; // fallback to default
    }

    const payload = {
      tagline: data.tagline,
      websiteDescription: data.description,
      primaryColor: primaryColor,
      templateCode: data.templateCode,
      websiteStats: {
        studentsEnrolled: parseInt(data.websiteStats.studentsEnrolled) || 0,
        teachers: parseInt(data.websiteStats.teachers) || 0,
        classes: parseInt(data.websiteStats.classes) || 0,
      },
      websiteValues: Array.isArray(data.websiteValues) ? data.websiteValues : [],
      websitePublished: data.websitePublished,
      onboardingCompleted: true,
    };


    try {
      const response = await saveOnboardingData(payload);
      if (response.success) {
        setSuccess(t("websiteSettings.saved", "Configuration saved successfully"));
        setOriginalData(response.data || payload);
        // Update theme color when primary color changes
        updatePrimaryColor(primaryColor);
      } else {
        setError(response.message || "Error saving configuration");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(err.response?.data?.message || err.message || "Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = originalData
    ? JSON.stringify({
        tagline: data.tagline,
        description: data.description,
        primaryColor: data.primaryColor,
        templateCode: data.templateCode,
        logoUrl: data.logoUrl,
        heroImageUrl: data.heroImageUrl,
        websiteStats: data.websiteStats,
        websiteValues: data.websiteValues,
        websitePublished: data.websitePublished,
      }) !==
      JSON.stringify({
        tagline: originalData.tagline || "",
        description: originalData.websiteDescription || "",
        primaryColor: originalData.primaryColor || "#085041",
        templateCode: originalData.templateCode || "modern",
        logoUrl: originalData.logoUrl || "",
        heroImageUrl: originalData.heroImageUrl || "",
        websiteStats: {
          studentsEnrolled: originalData.websiteStats?.studentsEnrolled?.toString() || "",
          teachers: originalData.websiteStats?.teachers?.toString() || "",
          classes: originalData.websiteStats?.classes?.toString() || "",
        },
        websiteValues: originalData.websiteValues || [],
        websitePublished: originalData.websitePublished || false,
      })
    : false;

  const pc = data.primaryColor;
  const initials = (user?.schoolName || "SC")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const tabs = [
    { key: "identity", label: t("websiteSettings.tabs.identity", "Identity"), icon: "image" },
    { key: "content", label: t("websiteSettings.tabs.content", "Content"), icon: "edit" },
    { key: "template", label: t("websiteSettings.tabs.template", "Template"), icon: "layout" },
    { key: "stats", label: t("websiteSettings.tabs.stats", "Stats & Values"), icon: "bar" },
    { key: "publish", label: t("websiteSettings.tabs.publish", "Publish"), icon: "globe" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
          <p className="text-sm text-surface-400">{t("actions.loading", "Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary-600 dark:text-primary-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
              {t("websiteSettings.title", "Site Vitrine — Configuration")}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              {t("websiteSettings.subtitle", "Configure your school's public website — logo, colours, content & more")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Preview link */}
          {data.websitePublished && user?.subdomain && (
            <a
              href={`/site?subdomain=${user.subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-3.5 border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {t("websiteSettings.preview", "Preview")}
            </a>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 bg-primary-900 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {t("actions.saving", "Saving...")}
              </span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {t("actions.save", "Save")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-200 dark:border-surface-700 mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary-600 text-primary-700 dark:text-primary-400"
                : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Identity — Logo, Color, School name */}
      {activeTab === "identity" && (
        <div className="space-y-6">
          {/* Logo */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
              {t("websiteSettings.logo.title", "School Logo")}
            </h2>
            <p className="text-xs text-surface-400 mb-4">
              {t("websiteSettings.logo.desc", "Upload your school logo. PNG, JPG or SVG — max 2MB.")}
            </p>
            <div className="flex items-center gap-5">
              <label
                htmlFor="ws-logo-upload"
                className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                style={{ backgroundColor: data.logoUrl ? "transparent" : pc + "15" }}
              >
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-2xl font-bold" style={{ color: pc }}>
                    {initials}
                  </span>
                )}
                <input
                  ref={logoInputRef}
                  id="ws-logo-upload"
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
                  {uploading.logo ? t("actions.uploading", "Uploading...") : t("websiteSettings.logo.upload", "Upload logo")}
                </button>
                {data.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, logoUrl: "" }))}
                    className="h-9 px-4 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {t("actions.remove", "Remove")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Primary Color */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
              {t("websiteSettings.color.title", "Primary Colour")}
            </h2>
            <p className="text-xs text-surface-400 mb-4">
              {t("websiteSettings.color.desc", "This colour will be used for buttons, links, and accents across your website.")}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex items-center gap-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded-lg px-3.5 py-2.5">
                <label
                  htmlFor="ws-color-picker"
                  className="w-8 h-8 rounded-lg cursor-pointer flex-shrink-0 border border-white/20"
                  style={{ backgroundColor: pc }}
                />
                <input
                  id="ws-color-picker"
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
        </div>
      )}

      {/* Tab: Content — Tagline, Description, Hero */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Tagline */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
              {t("websiteSettings.tagline.title", "Tagline / Slogan")}
            </h2>
            <p className="text-xs text-surface-400 mb-3">
              {t("websiteSettings.tagline.desc", "A short phrase that captures your school's spirit.")}
            </p>
            <input
              name="tagline"
              type="text"
              value={data.tagline}
              onChange={handleChange}
              placeholder={t("websiteSettings.tagline.placeholder", "Shaping the leaders of tomorrow, today.")}
              maxLength={80}
              className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors"
            />
            <p className="text-[11px] text-surface-400 mt-1.5 text-right">{data.tagline.length}/80</p>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
              {t("websiteSettings.description.title", "School Description")}
            </h2>
            <p className="text-xs text-surface-400 mb-3">
              {t("websiteSettings.description.desc", "Tell families what makes your school special.")}
            </p>
            <textarea
              name="description"
              rows={5}
              value={data.description}
              onChange={handleChange}
              placeholder={t("websiteSettings.description.placeholder", "Welcome to our school — a place where every child thrives...")}
              className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors resize-none"
            />
          </div>

          {/* Hero image */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
              {t("websiteSettings.hero.title", "Cover Image (Hero)")}
            </h2>
            <p className="text-xs text-surface-400 mb-4">
              {t("websiteSettings.hero.desc", "The main banner of your campus website. Recommended 1920×800px — max 5MB.")}
            </p>
            <label
              htmlFor="ws-hero-upload"
              className="flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed border-surface-200 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-400 transition-colors aspect-[21/9] max-h-48 overflow-hidden"
            >
              {data.heroImageUrl ? (
                <img src={data.heroImageUrl} alt="Hero banner" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 text-surface-400">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                    {uploading.hero ? t("actions.uploading", "Uploading...") : t("websiteSettings.hero.upload", "Click to upload cover image")}
                  </span>
                </>
              )}
              <input
                ref={heroInputRef}
                id="ws-hero-upload"
                type="file"
                accept="image/*"
                onChange={handleHeroUpload}
                className="hidden"
              />
            </label>
            {data.heroImageUrl && (
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, heroImageUrl: "" }))}
                  className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline"
                >
                  {t("actions.remove", "Remove cover image")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Template — Template selection */}
      {activeTab === "template" && (
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
            {t("websiteSettings.template.title", "Website Template")}
          </h2>
          <p className="text-xs text-surface-400 mb-5">
            {t("websiteSettings.template.desc", "Choose how your campus website looks. You can change this anytime.")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(TEMPLATE_PREVIEWS).map(([code, template]) => {
              const selected = data.templateCode === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, templateCode: code }))}
                  className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    selected
                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/15 shadow-sm"
                      : "border-surface-200 dark:border-surface-600 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-750"
                  }`}
                >
                  {selected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
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
        </div>
      )}

      {/* Tab: Stats & Values */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
              {t("websiteSettings.stats.title", "School Statistics")}
            </h2>
            <p className="text-xs text-surface-400 mb-4">
              {t("websiteSettings.stats.desc", "Display key numbers on your website to impress visitors.")}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("websiteSettings.stats.students", "Students enrolled")}
                </label>
                <input
                  type="number"
                  value={data.websiteStats.studentsEnrolled}
                  onChange={(e) => handleStatChange("studentsEnrolled", e.target.value)}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("websiteSettings.stats.teachers", "Teachers")}
                </label>
                <input
                  type="number"
                  value={data.websiteStats.teachers}
                  onChange={(e) => handleStatChange("teachers", e.target.value)}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("websiteSettings.stats.classes", "Classes")}
                </label>
                <input
                  type="number"
                  value={data.websiteStats.classes}
                  onChange={(e) => handleStatChange("classes", e.target.value)}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 text-sm outline-none focus:border-primary-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
              {t("websiteSettings.values.title", "School Values")}
            </h2>
            <p className="text-xs text-surface-400 mb-4">
              {t("websiteSettings.values.desc", "Add the core values that define your school's mission.")}
            </p>

            {/* Add value */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("websiteSettings.values.placeholder", "e.g. Excellence, Integrity, Community...")}
                className="flex-1 h-10 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddValue}
                disabled={!newValue.trim()}
                className="h-10 px-4 bg-primary-900 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t("actions.add", "Add")}
              </button>
            </div>

            {/* Values list */}
            {data.websiteValues.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-6 bg-surface-50 dark:bg-surface-900 rounded-lg">
                {t("websiteSettings.values.empty", "No values added yet. Type one above and click Add.")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.websiteValues.map((val, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded-full text-sm text-surface-700 dark:text-surface-200"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 text-primary-600">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {typeof val === 'string' ? val : val.label || val}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(i)}
                      className="text-surface-400 hover:text-red-500 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Publish */}
      {activeTab === "publish" && (
        <div className="space-y-6">
          {/* Publish toggle */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1">
                  {t("websiteSettings.publish.title", "Publish Website")}
                </h2>
                <p className="text-xs text-surface-400">
                  {t("websiteSettings.publish.desc", "Make your campus website visible to the public.")}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="websitePublished"
                  checked={data.websitePublished}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-200 dark:bg-surface-600 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          </div>

          {/* Summary preview card */}
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6" style={{ borderLeftWidth: "4px", borderLeftColor: pc }}>
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100 mb-3">
              {t("websiteSettings.summary.title", "Summary")}
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div className="text-surface-500">{t("websiteSettings.summary.logo", "Logo")}</div>
              <div className="text-surface-800 dark:text-surface-100 font-medium">
                {data.logoUrl ? t("websiteSettings.summary.uploaded", "Uploaded") : t("websiteSettings.summary.notSet", "Using initials")}
              </div>
              <div className="text-surface-500">{t("websiteSettings.summary.tagline", "Tagline")}</div>
              <div className="text-surface-800 dark:text-surface-100 font-medium truncate">
                {data.tagline || t("websiteSettings.summary.notSet", "—")}
              </div>
              <div className="text-surface-500">{t("websiteSettings.summary.template", "Template")}</div>
              <div className="text-surface-800 dark:text-surface-100 font-medium">
                {TEMPLATE_PREVIEWS[data.templateCode]?.name || data.templateCode}
              </div>
              <div className="text-surface-500">{t("websiteSettings.summary.stats", "Stats")}</div>
              <div className="text-surface-800 dark:text-surface-100 font-medium">
                {data.websiteStats.studentsEnrolled
                  ? `${data.websiteStats.studentsEnrolled} students · ${data.websiteStats.teachers || "0"} teachers · ${data.websiteStats.classes || "0"} classes`
                  : t("websiteSettings.summary.notSet", "—")}
              </div>
              <div className="text-surface-500">{t("websiteSettings.summary.values", "Values")}</div>
              <div className="text-surface-800 dark:text-surface-100 font-medium">
                {data.websiteValues.length > 0
                  ? `${data.websiteValues.length} value${data.websiteValues.length > 1 ? "s" : ""}`
                  : t("websiteSettings.summary.notSet", "—")}
              </div>
              <div className="text-surface-500">{t("websiteSettings.summary.status", "Status")}</div>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    data.websitePublished
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${data.websitePublished ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {data.websitePublished
                    ? t("websiteSettings.summary.published", "Published")
                    : t("websiteSettings.summary.draft", "Draft")}
                </span>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-0.5">
                {t("websiteSettings.info.title", "Your website URL")}
              </p>
              <p className="text-sm text-surface-400">
                {user?.subdomain
                  ? `${user.subdomain}.akademee.cm`
                  : t("websiteSettings.info.notAvailable", "Not available yet")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save bar (sticky bottom) */}
      <div className="sticky bottom-0 mt-8 -mx-6 px-6 py-4 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <p className="text-xs text-surface-400">
          {hasChanges
            ? t("websiteSettings.unsaved", "You have unsaved changes")
            : t("websiteSettings.allSaved", "All changes saved")}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="h-10 px-6 bg-primary-900 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              {t("saving", "Saving...")}
            </span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {t("save", "Save")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
