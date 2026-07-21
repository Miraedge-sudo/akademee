import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import api from "../../../core/api/axios";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import { FiHome, FiCheckCircle, FiArrowLeft, FiLock, FiEye, FiEyeOff, FiXCircle, FiLoader } from "react-icons/fi";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("auth");

  const token = searchParams.get("token");
  console.log('[ResetPasswordPage] Token from URL:', token);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
      setError(t("resetPassword.missingToken", "Invalid or missing reset token."));
    }
  }, [token, t]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError(t("resetPassword.pwdMismatch", "Passwords do not match"));
      return;
    }

    if (formData.password.length < 8) {
      setError(t("resetPassword.pwdTooShort", "Password must be at least 8 characters"));
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setInvalidToken(true);
      }
      setError(msg || t("resetPassword.genericError", "Something went wrong. Please try again."));
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
            <FiHome className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-base text-surface-800 dark:text-surface-100">Akademee</span>
        </div>
        <div className="flex items-center gap-2.5 ml-auto">
          <ThemeLangToggles />
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px] bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl shadow-sm p-8 lg:p-9">

          {success ? (
            /* Success state */
            <div className="text-center animate-fadeIn">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                <FiCheckCircle className="w-7 h-7 text-teal-600" />
              </div>
              <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
                {t("resetPassword.successTitle", "Password reset successful")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
                {t("resetPassword.successMessage", "Your password has been updated. Redirecting you to sign in...")}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-teal-600 font-medium hover:underline text-sm"
              >
                <FiArrowLeft className="w-4 h-4" />
                {t("resetPassword.goToLogin", "Go to sign in")}
              </Link>
            </div>
          ) : invalidToken ? (
            /* Invalid/expired token state */
            <div className="text-center animate-fadeIn">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <FiXCircle className="w-7 h-7 text-red-500" />
              </div>
              <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
                {t("resetPassword.invalidTitle", "Invalid or expired link")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
                {t("resetPassword.invalidMessage", "This password reset link is invalid or has expired. Please request a new one.")}
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 bg-teal-900 hover:bg-teal-800 text-teal-50 text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
              >
                {t("resetPassword.requestNew", "Request new link")}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold tracking-wide uppercase text-teal-600 mb-1.5">
                {t("resetPassword.eyebrow", "New Password")}
              </p>
              <h1 className="font-display text-2xl font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                {t("resetPassword.title", "Reset your password")}
              </h1>
              <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                {t("resetPassword.subtitle", "Choose a new password for your account.")}
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-[18px]">
                {/* New password */}
                <div>
                  <label htmlFor="password" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("resetPassword.newPasswordLabel", "New password")}
                  </label>
                  <div className="relative flex items-center">
                    <FiLock className="absolute left-3 w-4 h-4 text-surface-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full h-11 pl-10 pr-10 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                      aria-label="Toggle password visibility"
                    >
                      {showPwd ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("resetPassword.confirmLabel", "Confirm new password")}
                  </label>
                  <div className="relative flex items-center">
                    <FiLock className="absolute left-3 w-4 h-4 text-surface-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPwd2 ? "text" : "password"}
                      required
                      minLength={8}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full h-11 pl-10 pr-10 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd2((v) => !v)}
                      className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                      aria-label="Toggle password visibility"
                    >
                      {showPwd2 ? (
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
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                      </svg>
                      {t("resetPassword.resetting", "Resetting...")}
                    </span>
                  ) : (
                    <>
                      <FiLock className="w-[17px] h-[17px]" />
                      {t("resetPassword.submit", "Reset password")}
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
