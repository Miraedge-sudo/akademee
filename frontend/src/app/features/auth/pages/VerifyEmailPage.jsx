import { FiArrowLeft, FiCheck, FiShield, FiXCircle, FiLoader, FiArrowRight, FiHome } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import api from "../../../core/api/axios";
import { API_ENDPOINTS } from "../../../core/api/endpoints";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("auth");

  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | alreadyVerified | error
  const [message, setMessage] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [onboardingUrl, setOnboardingUrl] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("verifyEmail.missingToken", "No verification token found."));
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.SCHOOLS.VERIFY_EMAIL, {
          params: { token },
        });
        const data = response.data?.data;
        if (data?.alreadyVerified) {
          setStatus("alreadyVerified");
          setSchoolName(data.schoolName || "");
          setOnboardingUrl(data.onboardingUrl || "");
        } else {
          setStatus("success");
          setSchoolName(data?.schoolName || "");
          setOnboardingUrl(data?.onboardingUrl || "");
        }
      } catch (err) {
        const msg = err.response?.data?.message || t("verifyEmail.error", "Verification failed. The link may be invalid or expired.");
        setStatus("error");
        setMessage(msg);
      }
    };

    verify();
  }, [token, t]);

  const renderIcon = () => {
    switch (status) {
      case "loading":
        return (
          <FiLoader className="animate-spin w-8 h-8 text-teal-600" />
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

      case "success":
        return (
          <>
            <h1 className="font-display text-xl font-medium text-surface-800 dark:text-surface-100 mb-2">
              {t("verifyEmail.successTitle", "Email verified!")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-6">
              {schoolName
                ? t("verifyEmail.successMessage", "{{schoolName}} has been verified. You can now complete your campus setup.", { schoolName })
                : t("verifyEmail.successMessageSimple", "Your email has been verified successfully.")}
            </p>
            <Link
              to={onboardingUrl || "/login"}
              className="inline-flex items-center gap-2 bg-teal-900 hover:bg-teal-800 text-teal-50 text-sm font-semibold px-6 py-2.5 rounded-md transition-colors"
            >                              <FiArrowRight className="w-4 h-4" />
                              {t("verifyEmail.continueSetup", "Continue to setup")}
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
                ? t("verifyEmail.alreadyVerifiedMessage", "{{schoolName}} has already been verified.", { schoolName })
                : t("verifyEmail.alreadyVerifiedMessageSimple", "This email has already been verified.")}
            </p>
            <Link
              to={onboardingUrl || "/login"}
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
