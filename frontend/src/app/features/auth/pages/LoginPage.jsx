import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation("auth");

  const [formData, setFormData] = useState({
    subdomain: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(formData);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(t("login.genericError", "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900">

      {/* Top nav */}
        <div className="flex items-center justify-between px-6 lg:px-11 py-5 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-7 h-7 rounded-md bg-teal-900 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-display text-base text-surface-800 dark:text-surface-100">Akademee</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeLangToggles />
            <p className="text-[13.5px] text-surface-400 ml-1">
              {t("login.noAccount", "Don't have a school yet?")}{" "}
              <Link to="/register" className="text-teal-600 font-medium hover:underline">
                {t("login.registerLink", "Register your school")}
              </Link>
            </p>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px] bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl shadow-sm p-8 lg:p-9">

            <p className="text-[11px] font-semibold tracking-wide uppercase text-teal-600 mb-1.5">
              {t("login.eyebrow", "School Portal")}
            </p>
            <h1 className="font-display text-2xl font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              {t("login.title", "Welcome back")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
              {t("login.subtitle", "Enter your school details to access your campus.")}
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-[18px]">

              {/* Subdomain */}
              <div>
                <label htmlFor="subdomain" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("login.subdomainLabel", "School subdomain")}
                </label>
                <div className="relative flex items-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 w-4 h-4 text-surface-400">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <input
                    id="subdomain"
                    name="subdomain"
                    type="text"
                    required
                    value={formData.subdomain}
                    onChange={handleChange}
                    placeholder="grace-bilingual"
                    autoComplete="off"
                    className="w-full h-11 pl-10 pr-[120px] rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                  />
                  <span className="absolute right-0 h-full flex items-center px-3 text-[12.5px] text-surface-500 bg-surface-100 dark:bg-surface-700 border-l-[1.5px] border-surface-200 dark:border-surface-600 rounded-r-md">
                    .akademee.cm
                  </span>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("login.emailLabel", "Email address")}
                </label>
                <div className="relative flex items-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 w-4 h-4 text-surface-400">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@yourschool.cm"
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-3.5 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300">
                    {t("login.passwordLabel", "Password")}
                  </label>
                  <Link to="/forgot-password" className="text-[12px] text-teal-600 hover:underline font-medium">
                    {t("login.forgotPassword", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 w-4 h-4 text-surface-400">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full h-11 pl-10 pr-10 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[46px] mt-2 bg-teal-900 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-teal-50 text-[15px] font-semibold rounded-md flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                {loading ? (
                  t("login.signingIn", "Signing in...")
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    {t("login.submit", "Sign in to your school")}
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-2.5 my-5">
              <div className="flex-1 h-px bg-surface-100 dark:bg-surface-700" />
              <span className="text-xs text-surface-400">{t("login.or", "or")}</span>
              <div className="flex-1 h-px bg-surface-100 dark:bg-surface-700" />
            </div>

            <p className="text-center text-[13.5px] text-surface-400">
              {t("login.noAccount", "Don't have a school yet?")}{" "}
              <Link to="/register" className="text-teal-600 font-medium hover:underline">
                {t("login.registerLink", "Register your school")}
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}