import { FiCheck, FiArrowLeft, FiArrowRight, FiHome, FiGlobe, FiMapPin, FiMail, FiPhone, FiUser, FiLock, FiEye, FiLoader } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import api from "../../../core/api/axios";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import { useAuth } from "../../../core/hooks/useAuth";
import { getSubdomainFromHostname, saveSubdomain, clearSubdomain } from "../../../core/utils/subdomainHelper";
import RegisterLeftPanel from "../../../components/features/RegisterLeftPanel";

const STEPS = [
  { num: 1, key: "school" },
  { num: 2, key: "admin" },
  { num: 3, key: "plan" },
];

const PLANS = [
  { id: "free", priceFcfa: "0", badge: null, badgeColor: null },
  { id: "basic", priceFcfa: "15 000", badge: "popular", badgeColor: "amber" },
  { id: "premium", priceFcfa: "35 000", badge: "pro", badgeColor: "teal" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("auth");
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    schoolName: "",
    subdomain: "",
    city: "",
    region: "",
    email: "",
    firstName: "",
    lastName: "",
    adminEmail: "",
    phone: "",
    password: "",
    confirmPassword: "",
    planId: "basic",
    templateCode: "bold",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  // If user arrived on a school subdomain (e.g. teste.lvh.me:3000/register),
  // redirect to the main domain — registration must be domain-neutral.
  useEffect(() => {
    const subdomain = getSubdomainFromHostname();
    if (subdomain) {
      clearSubdomain();
      const port = window.location.port ? `:${window.location.port}` : '';
      window.location.href = `http://localhost${port}/register`;
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSchoolNameInput = (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, schoolName: value };
      // auto-generate subdomain only if user hasn't typed one manually
      if (!prev.subdomain) {
        next.subdomain = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError(t("register.pwdMismatch", "Passwords do not match"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.SCHOOLS.REGISTER, formData);
      if (response.data.success) {
        const { data } = response.data;

        // Cookies are set by the backend — no manual token storage needed

        // Save subdomain for subdomain routing
        const schoolSubdomain = data?.school?.subdomain || formData.subdomain;
        if (schoolSubdomain) {
          saveSubdomain(schoolSubdomain);
        }

        // Redirect to onboarding
        window.location.href = "/onboarding";
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          t("register.genericError", "An error occurred during registration")
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const inputClass =
    "w-full h-11 pl-10 pr-3.5 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-all duration-200";

  const staggerItem = (i) => ({ animationDelay: `${i * 0.07}s` });

  const iconMap = {
    home: <FiHome className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />,
    globe: <FiGlobe className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />,
    mapPin: <FiMapPin className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />,
    mail: <FiMail className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />,
    phone: <FiPhone className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />,
    user: <FiUser className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />,
    lock: <FiLock className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />,
  };
  const Icon = ({ name }) => iconMap[name] || null;

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-900">

      <RegisterLeftPanel />

      {/* ══ RIGHT PANEL — Form ══ */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Floating decorative blobs */}
        <div className="absolute top-32 right-10 w-64 h-64 bg-teal-200/20 dark:bg-teal-800/10 rounded-full blur-3xl pointer-events-none animate-float" />
        <div
          className="absolute bottom-20 left-10 w-48 h-48 bg-teal-100/20 dark:bg-teal-900/10 rounded-full blur-3xl pointer-events-none animate-float"
          style={{ animationDelay: "2s" }}
        />

        {/* Top nav */}
        <div className="relative z-10 flex items-center justify-between px-6 lg:px-11 py-5 bg-white/80 dark:bg-surface-800/80 backdrop-blur-md border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-teal-900 flex items-center justify-center">            <FiHome className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-base text-surface-800 dark:text-surface-100">Akademee</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeLangToggles />
            <p className="text-[13.5px] text-surface-400">
              {t("register.haveAccount", "Already registered?")}{" "}
              <Link to="/login" className="text-teal-600 font-medium hover:underline">
                {t("register.signInLink", "Sign in")}
              </Link>
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="relative z-10 flex items-center gap-1.5 px-6 lg:px-11 pt-6 max-w-[560px] w-full mx-auto">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 transition-all duration-500 ${
                  step > s.num
                    ? "bg-teal-600 border-teal-600 text-white scale-100"
                    : step === s.num
                    ? "bg-teal-900 border-teal-900 text-white shadow-lg shadow-teal-900/30 scale-110"
                    : "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-600 text-surface-400 scale-100"
                }`}
              >
                {step > s.num ? (
                  <FiCheck className="w-3.5 h-3.5" />
                ) : (
                  s.num
                )}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap transition-all duration-300 ${
                  step >= s.num ? "text-teal-700 dark:text-teal-400" : "text-surface-400"
                }`}
              >
                {t(`register.step.${s.key}`, s.key)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-[1.5px] mx-1 -mt-4 transition-all duration-500 ${
                  step > s.num ? "bg-teal-400" : "bg-surface-200 dark:bg-surface-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="relative z-10 flex-1 flex justify-center px-6 py-8">
        <div className="w-full max-w-[480px]">
          <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl shadow-sm overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"
              style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
            >

              {/* ══ SLIDE 1 — School ══ */}
              <div className="w-full flex-shrink-0 p-7 lg:p-9">
                {error && (
                  <div className="mb-5 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-fadeIn">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-teal-600 mb-1.5">
                    {t("register.stepLabel", "Step")} 1 {t("register.of", "of")} 3
                  </p>
                  <h1 className="font-display text-2xl font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                    {t("register.school.title", "Your school")}
                  </h1>
                  <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                    {t("register.school.subtitle", "Tell us about your institution — this creates your unique campus on Akademee.")}
                  </p>

                  <div className="space-y-[18px]">
                    <div className="animate-fadeIn" style={staggerItem(0)}>
                      <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                        {t("register.school.name", "School name")} <span className="text-teal-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Icon name="home" />
                        <input
                          name="schoolName"
                          type="text"
                          required
                          value={formData.schoolName}
                          onChange={handleSchoolNameInput}
                          placeholder="Grace Bilingual Academy"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="animate-fadeIn" style={staggerItem(1)}>
                      <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                        {t("register.school.subdomain", "Campus subdomain")} <span className="text-teal-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Icon name="globe" />
                        <input
                          name="subdomain"
                          type="text"
                          required
                          value={formData.subdomain}
                          onChange={handleChange}
                          placeholder="grace-bilingual"
                          className={`${inputClass} pr-[120px]`}
                        />
                        <span className="absolute right-0 h-full flex items-center px-3 text-[12px] text-surface-500 bg-surface-100 dark:bg-surface-700 border-l-[1.5px] border-surface-200 dark:border-surface-600 rounded-r-md pointer-events-none">
                          .akademee.cm
                        </span>
                      </div>
                      <p className="text-[11.5px] text-surface-400 mt-1.5">
                        {t("register.school.subdomainHint", "Your campus will be at")}{" "}
                        <strong className="text-surface-600 dark:text-surface-300">
                          {(formData.subdomain || "yourschool") + ".akademee.cm"}
                        </strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 animate-fadeIn" style={staggerItem(2)}>
                      <div>
                        <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                          {t("register.school.city", "City")} <span className="text-teal-600">*</span>
                        </label>
                        <div className="relative flex items-center">
                        <Icon name="mapPin" />
                          <input
                            name="city"
                            type="text"
                            required
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Douala"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                          {t("register.school.region", "Region")}
                        </label>
                        <div className="relative flex items-center">
                        <Icon name="mapPin" />
                          <input
                            name="region"
                            type="text"
                            value={formData.region}
                            onChange={handleChange}
                            placeholder="Littoral"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="animate-fadeIn" style={staggerItem(3)}>
                      <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                        {t("register.school.email", "School email")} <span className="text-teal-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Icon>
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </Icon>
                        <input
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="info@yourschool.cm"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="animate-fadeIn" style={staggerItem(4)}>
                      <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                        {t("register.school.phone", "Phone number")} <span className="text-[11px] text-surface-400 font-normal">({t("register.optional", "optional")})</span>
                      </label>
                      <div className="relative flex items-center">
                        <Icon name="phone" />
                        <input
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+237 6XX XXX XXX"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full h-[46px] mt-7 bg-teal-900 hover:bg-teal-800 text-teal-50 text-[15px] font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] hover:shadow-lg hover:shadow-teal-900/20 hover:scale-[1.01] group"
                  >
                    {t("register.continueAdmin", "Continue — Admin account")}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px] group-hover:translate-x-0.5 transition-transform">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </form>
                <p className="text-center text-[13.5px] text-surface-400 mt-6 animate-fadeIn">
                  {t("register.haveAccount", "Already registered?")}{" "}
                  <Link to="/login" className="text-teal-600 font-medium hover:underline">
                    {t("register.signInLink", "Sign in")}
                  </Link>
                </p>
              </div>

              {/* ══ SLIDE 2 — Admin ══ */}
              <div className="w-full flex-shrink-0 p-7 lg:p-9">
                {error && (
                  <div className="mb-5 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-fadeIn">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-teal-600 mb-1.5">
                    {t("register.stepLabel", "Step")} 2 {t("register.of", "of")} 3
                  </p>
                  <h1 className="font-display text-2xl font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                    {t("register.admin.title", "Admin account")}
                  </h1>
                  <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                    {t("register.admin.subtitle", "This will be the primary administrator account for your campus.")}
                  </p>

                  <div className="space-y-[18px]">
                    <div className="grid grid-cols-2 gap-3 animate-fadeIn" style={staggerItem(0)}>
                      <div>
                        <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                          {t("register.admin.firstName", "First name")} <span className="text-teal-600">*</span>
                        </label>
                        <div className="relative flex items-center">
                        <Icon name="user" />
                          <input
                            name="firstName"
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Jean"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                          {t("register.admin.lastName", "Last name")} <span className="text-teal-600">*</span>
                        </label>
                        <div className="relative flex items-center">
                        <Icon name="user" />
                          <input
                            name="lastName"
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Dupont"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="animate-fadeIn" style={staggerItem(1)}>
                      <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                        {t("register.admin.email", "Email address")} <span className="text-teal-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Icon name="mail" />
                        <input
                          name="adminEmail"
                          type="email"
                          required
                          value={formData.adminEmail}
                          onChange={handleChange}
                          placeholder="admin@yourschool.cm"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="animate-fadeIn" style={staggerItem(2)}>
                      <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                        {t("register.admin.password", "Password")} <span className="text-teal-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Icon name="lock" />
                        <input
                          name="password"
                          type={showPwd ? "text" : "password"}
                          required
                          minLength={8}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder={t("register.admin.passwordPlaceholder", "Min. 8 characters")}
                          className={`${inputClass} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="animate-fadeIn" style={staggerItem(3)}>
                      <label className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                        {t("register.admin.confirmPassword", "Confirm password")} <span className="text-teal-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Icon name="lock" />
                        <input
                          name="confirmPassword"
                          type={showPwd2 ? "text" : "password"}
                          required
                          minLength={8}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder={t("register.admin.repeatPassword", "Repeat password")}
                          className={`${inputClass} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd2((v) => !v)}
                          className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-7 animate-fadeIn" style={staggerItem(4)}>
                    <button
                      type="button"
                      onClick={prevStep}
                      className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
                    >
                      <FiArrowLeft className="w-3.5 h-3.5" />
                      {t("register.back", "Back")}
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 h-11 bg-teal-900 hover:bg-teal-800 text-teal-50 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-teal-900/20 hover:scale-[1.01] active:scale-[0.98]"
                    >
                      {t("register.continuePlan", "Continue — Choose a plan")}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>

              {/* ══ SLIDE 3 — Plan ══ */}
              <div className="w-full flex-shrink-0 p-7 lg:p-9">
                {error && (
                  <div className="mb-5 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-fadeIn">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-teal-600 mb-1.5">
                    {t("register.stepLabel", "Step")} 3 {t("register.of", "of")} 3
                  </p>
                  <h1 className="font-display text-2xl font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                    {t("register.plan.title", "Choose your plan")}
                  </h1>
                  <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                    {t("register.plan.subtitle", "Start free and upgrade whenever your school is ready. No credit card required.")}
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {PLANS.map((plan, pi) => {
                      const selected = formData.planId === plan.id;
                      return (
                        <label
                          key={plan.id}
                          className={`animate-fadeIn flex items-center gap-3.5 p-4 rounded-lg border-[1.5px] cursor-pointer transition-all duration-200 ${
                            selected
                              ? "border-teal-600 bg-teal-50 dark:bg-teal-900/15 shadow-md shadow-teal-500/10 scale-[1.02]"
                              : "border-surface-200 dark:border-surface-600 hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 hover:scale-[1.01]"
                          }`}
                          style={staggerItem(pi)}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                              selected ? "border-teal-600 bg-teal-600 scale-110" : "border-surface-300 dark:border-surface-500"
                            }`}
                          >
                            {selected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-scaleIn" />}
                          </span>
                          <span className="flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                                {t(`register.plan.${plan.id}.name`, plan.id)}
                              </span>
                              {plan.badge && (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    plan.badgeColor === "amber"
                                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                      : plan.badgeColor === "teal"
                                      ? "bg-teal-900 text-teal-100"
                                      : "bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300"
                                  }`}
                                >
                                  {t(`register.plan.badge.${plan.badge}`, plan.badge)}
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-surface-400 mt-0.5">
                              {t(`register.plan.${plan.id}.desc`, "")}
                            </span>
                          </span>
                          <span className="text-[15px] font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                            {plan.priceFcfa}{" "}
                            <span className="text-[11px] font-normal text-surface-400">
                              {t("register.plan.perMonth", "FCFA / mo")}
                            </span>
                          </span>
                          <input
                            type="radio"
                            name="planId"
                            value={plan.id}
                            checked={selected}
                            onChange={handleChange}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex gap-2.5 mt-7 animate-fadeIn" style={staggerItem(4)}>
                    <button
                      type="button"
                      onClick={prevStep}
                      className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
                    >
                      <FiArrowLeft className="w-3.5 h-3.5" />
                      {t("register.back", "Back")}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-11 bg-teal-900 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-teal-50 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-teal-900/20 active:scale-[0.98] disabled:scale-100"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <FiLoader className="animate-spin w-4 h-4" />
                          {t("register.creating", "Creating your campus...")}
                        </span>
                      ) : (
                        <>
                          <FiCheck className="w-4 h-4" />
                          {t("register.submit", "Create my campus")}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}