import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import api from "../../../core/api/axios";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import { getSubdomain } from "../../../core/utils/subdomainHelper";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");

  const [formData, setFormData] = useState({
    subdomain: getSubdomain() || "",
    email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, formData);
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          t("forgotPassword.genericError", "Something went wrong. Please try again.")
      );
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
        <div className="flex items-center gap-2.5 ml-auto">
          <ThemeLangToggles />
          <p className="text-[13.5px] text-surface-400 ml-1">
            {t("forgotPassword.rememberPassword", "Remember your password?")}{" "}
            <Link to="/login" className="text-teal-600 font-medium hover:underline">
              {t("forgotPassword.signInLink", "Sign in")}
            </Link>
          </p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px] bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl shadow-sm p-8 lg:p-9">

          {sent ? (
            /* Success state */
            <div className="text-center animate-fadeIn">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-teal-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
                {t("forgotPassword.sentTitle", "Check your email")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
                {t("forgotPassword.sentMessage", "If an account exists with that email, we've sent a password reset link. It expires in 1 hour.")}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-teal-600 font-medium hover:underline text-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                {t("forgotPassword.backToLogin", "Back to sign in")}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold tracking-wide uppercase text-teal-600 mb-1.5">
                {t("forgotPassword.eyebrow", "Password Reset")}
              </p>
              <h1 className="font-display text-2xl font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                {t("forgotPassword.title", "Forgot your password?")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                {t("forgotPassword.subtitle", "Enter your school subdomain and email address and we'll send you a reset link.")}
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
                    {t("forgotPassword.subdomainLabel", "School subdomain")}
                  </label>
                  <div className="relative flex items-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 w-4 h-4 text-surface-400">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <input
                      id="subdomain"
                      name="subdomain"
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={handleChange}
                      placeholder={t("forgotPassword.subdomainPlaceholder", "e.g. grace-academy")}
                      autoComplete="off"
                      className="w-full h-11 pl-10 pr-3.5 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("forgotPassword.emailLabel", "Email address")}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[46px] mt-2 bg-teal-900 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-teal-50 text-[15px] font-semibold rounded-md flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                      </svg>
                      {t("forgotPassword.sending", "Sending...")}
                    </span>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      {t("forgotPassword.submit", "Send reset link")}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-[13px] text-teal-600 hover:underline font-medium inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("forgotPassword.backToLogin", "Back to sign in")}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
