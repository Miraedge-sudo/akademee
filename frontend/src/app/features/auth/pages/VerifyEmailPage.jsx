import { FiArrowLeft, FiCheck, FiShield, FiXCircle, FiLoader, FiArrowRight, FiHome, FiMail } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import api, { setAccessToken } from "../../../core/api/axios";
import { API_ENDPOINTS } from "../../../core/api/endpoints";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("auth");

  const token = searchParams.get("token");
  const type = searchParams.get("type") || "school";
  const subdomain = searchParams.get("subdomain");
  const schoolNameParam = searchParams.get("schoolName");
  const schoolVerifyUrlParam = searchParams.get("schoolVerifyUrl");
  const adminVerifyUrlParam = searchParams.get("adminVerifyUrl");

  const [status, setStatus] = useState("loading"); // loading | pending | success | alreadyVerified | error
  const [message, setMessage] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [onboardingUrl, setOnboardingUrl] = useState("");
  const [loginUrl, setLoginUrl] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [schoolVerifyUrl, setSchoolVerifyUrl] = useState("");
  const [adminVerifyUrl, setAdminVerifyUrl] = useState("");
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Store fallback verification URLs from registration for dev/SMTP-fallback use
    if (schoolVerifyUrlParam) setSchoolVerifyUrl(decodeURIComponent(schoolVerifyUrlParam));
    if (adminVerifyUrlParam) setAdminVerifyUrl(decodeURIComponent(adminVerifyUrlParam));

    // If no token, show pending state (post-registration)
    if (!token && subdomain) {
      setStatus("pending");
      setSchoolName(schoolNameParam || "");
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage(t("verifyEmail.missingToken", "No verification token found."));
      return;
    }

    // Prevent React Strict Mode from running verification twice and consuming the token
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verify = async () => {
      try {
        let response;
        let data;

        if (type === "admin") {
          response = await api.get(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
            params: { token },
          });
          data = response.data?.data;
          setSchoolName(data?.schoolName || "");
          setLoginUrl(data?.loginUrl || "/login");
        } else {
          response = await api.get(API_ENDPOINTS.SCHOOLS.VERIFY_EMAIL, {
            params: { token },
          });
          data = response.data?.data;
          setSchoolName(data?.schoolName || "");
          setOnboardingUrl(data?.onboardingUrl || "");

          // Persist auth session from school verification so the user can proceed to onboarding
          const session = data?.session;
          console.log('[VerifyEmailPage] School verification response session:', session);
          if (session?.token) {
            setAccessToken(session.token);
            localStorage.setItem("token", session.token);
            if (session.refreshToken) {
              localStorage.setItem("refreshToken", session.refreshToken);
            }
            if (session.user) {
              localStorage.setItem("user", JSON.stringify(session.user));
            }
          } else {
            console.warn('[VerifyEmailPage] No session returned from school verification; will need login for onboarding.');
          }
        }

        if (data?.alreadyVerified) {
          setStatus("alreadyVerified");
        } else {
          setStatus("success");
        }

        // School verification should go straight to onboarding, not login.
        // Use a full redirect so AuthProvider re-runs and picks up the stored token.
        if (type !== "admin" && data?.subdomain) {
          const hasSession = !!data?.session?.token;
          const redirectUrl = hasSession
            ? `/onboarding?subdomain=${encodeURIComponent(data.subdomain)}`
            : `/login?subdomain=${encodeURIComponent(data.subdomain)}`;
          console.log('[VerifyEmailPage] Redirecting after school verification to:', redirectUrl, 'hasSession:', hasSession);
          window.location.replace(redirectUrl);
          return;
        }
      } catch (err) {
        const msg = err.response?.data?.message || t("verifyEmail.error", "Verification failed. The link may be invalid or expired.");
        setStatus("error");
        setMessage(msg);
      }
    };

    verify();
  }, [token, type, subdomain, schoolNameParam, t]);

  const handleResend = async () => {
    if (!subdomain) return;
    setResending(true);
    setResendMessage("");
    try {
      const response = await api.post(API_ENDPOINTS.SCHOOLS.RESEND_VERIFICATION_REQUEST, { subdomain });
      if (response.data.success) {
        const responseData = response.data?.data || {};
        setResendMessage(t("verifyEmail.resendSuccess", "Verification emails have been sent. Please check your inbox."));
        if (responseData.schoolVerificationUrl) {
          setSchoolVerifyUrl(responseData.schoolVerificationUrl);
        }
        if (responseData.adminVerificationUrls?.length > 0) {
          setAdminVerifyUrl(responseData.adminVerificationUrls[0]);
        }
      } else {
        setResendMessage(response.data.message || t("verifyEmail.resendError", "Failed to resend verification email."));
      }
    } catch (err) {
      setResendMessage(err.response?.data?.message || t("verifyEmail.resendError", "Failed to resend verification email."));
    } finally {
      setResending(false);
    }
  };

  const renderIcon = () => {
    switch (status) {
      case "loading":
        return (
          <FiLoader className="animate-spin w-8 h-8 text-teal-600" />
        );
      case "pending":
        return (
          <FiMail className="w-8 h-8 text-teal-600" />
        );
      case "success":
        return (
          <FiCheck className="w-8 h-8 text-teal-600" />
        );
      case "alreadyVerified":
        return (
          <FiShield className="w-8 h-8 text-amber-500" />
        );
      case "error":
        return (
          <FiXCircle className="w-8 h-8 text-red-500" />
        );
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
              {t("verifyEmail.verifying", "Verifying your email...")}
            </h1>
            <p className="text-[13.5px] text-surface-400">
              {t("verifyEmail.verifyingDesc", "Please wait while we confirm your email address.")}
            </p>
          </>
        );

      case "pending":
        return (
          <>
            <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
              {t("verifyEmail.pendingTitle", "Check your email")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
              {schoolName
                ? t("verifyEmail.pendingMessage", "We've sent verification emails to your school and admin contacts for {{schoolName}}. Please check your inbox and click the verification links to continue.", { schoolName })
                : t("verifyEmail.pendingMessageSimple", "We've sent verification emails. Please check your inbox and click the verification links to continue.")}
            </p>
            {resendMessage && (
              <div className={`mb-4 px-3 py-2 rounded-md text-sm ${resendMessage.includes("sent") ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
                {resendMessage}
              </div>
            )}

            {(schoolVerifyUrl || adminVerifyUrl) && (
              <div className="mb-5 p-4 rounded-md bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600 text-left">
                <p className="text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-2">
                  {t("verifyEmail.devLinks", "Development fallback links (use these if email is unavailable):")}
                </p>
                {schoolVerifyUrl && (
                  <a
                    href={schoolVerifyUrl}
                    className="block text-[13px] text-teal-600 hover:underline truncate mb-1"
                  >
                    {t("verifyEmail.verifySchoolLink", "Verify school email")}
                  </a>
                )}
                {adminVerifyUrl && (
                  <a
                    href={adminVerifyUrl}
                    className="block text-[13px] text-teal-600 hover:underline truncate"
                  >
                    {t("verifyEmail.verifyAdminLink", "Verify admin email")}
                  </a>
                )}
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-2 bg-teal-900 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-teal-50 text-sm font-semibold px-6 py-2.5 rounded-md transition-colors"
            >
              {resending ? (
                <>
                  <FiLoader className="animate-spin w-4 h-4" />
                  {t("verifyEmail.resending", "Resending...")}
                </>
              ) : (
                <>
                  <FiArrowRight className="w-4 h-4" />
                  {t("verifyEmail.resend", "Resend verification emails")}
                </>
              )}
            </button>
          </>
        );

      case "success":
        return (
          <>
            <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
              {type === "admin"
                ? t("verifyEmail.adminSuccessTitle", "Admin email verified!")
                : t("verifyEmail.successTitle", "Email verified!")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
              {schoolName
                ? type === "admin"
                  ? t("verifyEmail.adminSuccessMessage", "Your admin account for {{schoolName}} is verified. You can now sign in.", { schoolName })
                  : t("verifyEmail.successMessage", "{{schoolName}} has been verified. You can now complete your campus setup.", { schoolName })
                : t("verifyEmail.successMessageSimple", "Your email has been verified successfully.")}
            </p>
            <Link
              to={type === "admin" ? loginUrl : onboardingUrl || "/login"}
              className="inline-flex items-center gap-2 bg-teal-900 hover:bg-teal-800 text-teal-50 text-sm font-semibold px-6 py-2.5 rounded-md transition-colors"
            >                              <FiArrowRight className="w-4 h-4" />
                              {type === "admin"
                                ? t("verifyEmail.goToLogin", "Go to sign in")
                                : t("verifyEmail.continueSetup", "Continue to setup")}
            </Link>
          </>
        );

      case "alreadyVerified":
        return (
          <>
            <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
              {t("verifyEmail.alreadyVerifiedTitle", "Already verified")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
              {schoolName
                ? type === "admin"
                  ? t("verifyEmail.adminAlreadyVerifiedMessage", "Your admin account for {{schoolName}} is already verified.", { schoolName })
                  : t("verifyEmail.alreadyVerifiedMessage", "{{schoolName}} has already been verified.", { schoolName })
                : t("verifyEmail.alreadyVerifiedMessageSimple", "This email has already been verified.")}
            </p>
            <Link
              to={type === "admin" ? loginUrl : onboardingUrl || "/login"}
              className="inline-flex items-center gap-2 bg-teal-900 hover:bg-teal-800 text-teal-50 text-sm font-semibold px-6 py-2.5 rounded-md transition-colors"
            >                              <FiArrowRight className="w-4 h-4" />
                              {t("verifyEmail.goToLogin", "Go to sign in")}
            </Link>
          </>
        );

      case "error":
        return (
          <>
            <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
              {t("verifyEmail.errorTitle", "Verification failed")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
              {message}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-teal-600 font-medium hover:underline text-sm"
            >
              <FiArrowLeft className="w-4 h-4" />
              {t("verifyEmail.backToLogin", "Back to sign in")}
            </Link>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900">
      {/* Top nav */}
      <div className="flex items-center justify-between px-6 lg:px-11 py-5 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-teal-900 flex items-center justify-center">
            <FiHome className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-base text-surface-800 dark:text-surface-100">Akademee</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeLangToggles />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px] bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl shadow-sm p-8 lg:p-9 text-center">
          <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center ${
            status === "error"
              ? "bg-red-50 dark:bg-red-900/20"
              : status === "alreadyVerified"
              ? "bg-amber-50 dark:bg-amber-900/20"
              : status === "success"
              ? "bg-teal-50 dark:bg-teal-900/20"
              : status === "pending"
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "bg-surface-100 dark:bg-surface-700"
          }`}>
            {renderIcon()}
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
