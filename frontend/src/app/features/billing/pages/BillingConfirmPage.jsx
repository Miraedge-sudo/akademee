import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import api from "../../../core/api/axios";
import { useBrandLogo } from "../../../core/hooks/useBrandLogo";
import { useTheme } from "../../../core/hooks/useTheme";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import {
  FiCheckCircle,
  FiLoader,
  FiXCircle,
  FiRefreshCw,
  FiCreditCard,
  FiArrowRight,
  FiShield,
  FiClock,
  FiCheck,
  FiArrowLeft,
} from "react-icons/fi";

// ── Kente pattern SVG ──
function KentePattern({ className = "" }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id="kente-confirm" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M32 4 L60 32 L32 60 L4 32 Z" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
          <path d="M32 18 L46 32 L32 46 L18 32 Z" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
          <rect x="0" y="0" width="8" height="64" fill="currentColor" fillOpacity="0.08" />
          <rect x="56" y="0" width="8" height="64" fill="currentColor" fillOpacity="0.08" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kente-confirm)" />
    </svg>
  );
}

export default function BillingConfirmPage() {
  const { refreshUser, logout } = useAuth();
  const { i18n } = useTranslation("landing");
  const isFr = i18n.language === "fr";
  const akademeeLogo = useBrandLogo();
  const { theme } = useTheme();
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState(
    isFr ? "Vérification de votre paiement en cours..." : "Verifying your payment..."
  );

  const POLL_INTERVAL = 3000;
  const MAX_ATTEMPTS = 15;

  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.BILLING.PAYMENT_STATUS);
      const { subscription } = res.data.data || {};
      if (subscription?.status === "active") {
        setStatus("success");
        setMessage(isFr ? "Paiement confirmé ! Redirection..." : "Payment confirmed! Redirecting...");
        await refreshUser();
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [isFr, refreshUser]);

  const handleManualConfirm = async () => {
    setStatus("checking");
    try {
      const res = await api.post(API_ENDPOINTS.BILLING.CONFIRM_MANUAL);
      if (res.data?.data?.confirmed) {
        setStatus("success");
        setMessage(isFr ? "Paiement confirmé !" : "Payment confirmed!");
        await refreshUser();
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        setStatus("error");
        setMessage(
          isFr
            ? "Le paiement n'a pas encore été confirmé par Fapshi. Réessayez dans quelques secondes."
            : "Payment not yet confirmed by Fapshi. Try again in a few seconds."
        );
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Verification failed");
    }
  };

  // Auto-confirm: after 5 failed polls (15s), try confirm-manual automatically
  // This handles sandbox/local dev where Fapshi webhook can't reach localhost
  const AUTO_CONFIRM_AFTER = 5;

  useEffect(() => {
    let intervalId;
    let count = 0;
    let autoConfirmed = false;

    const poll = async () => {
      count++;
      setAttempts(count);
      const done = await checkPaymentStatus();
      if (done) {
        clearInterval(intervalId);
        return;
      }
      // After AUTO_CONFIRM_AFTER polls, try the manual confirm endpoint
      if (count >= AUTO_CONFIRM_AFTER && !autoConfirmed) {
        autoConfirmed = true;
        clearInterval(intervalId);
        try {
          const res = await api.post(API_ENDPOINTS.BILLING.CONFIRM_MANUAL);
          if (res.data?.data?.confirmed) {
            setStatus("success");
            setMessage(isFr ? "Paiement confirmé ! Redirection..." : "Payment confirmed! Redirecting...");
            await refreshUser();
            setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
          } else {
            // Not yet confirmed by Fapshi — retry a few more times
            let retryCount = 0;
            const retryInterval = setInterval(async () => {
              retryCount++;
              if (retryCount > 10) {
                clearInterval(retryInterval);
                setStatus("error");
                setMessage(
                  isFr
                    ? "Le paiement n'a pas encore été confirmé. Réessayez plus tard."
                    : "Payment not yet confirmed. Please try again later."
                );
                return;
              }
              try {
                const retry = await api.post(API_ENDPOINTS.BILLING.CONFIRM_MANUAL);
                if (retry.data?.data?.confirmed) {
                  clearInterval(retryInterval);
                  setStatus("success");
                  setMessage(isFr ? "Paiement confirmé ! Redirection..." : "Payment confirmed! Redirecting...");
                  await refreshUser();
                  setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
                }
              } catch { /* retry */ }
            }, 3000);
          }
        } catch {
          // Fapshi might not have processed yet — show error
          setStatus("error");
          setMessage(
            isFr
              ? "Le paiement est en cours de traitement. Réessayez dans quelques secondes."
              : "Payment is being processed. Please try again in a few seconds."
          );
        }
      }
    };

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [checkPaymentStatus, isFr, refreshUser]);

  const progressPct = Math.min((attempts / MAX_ATTEMPTS) * 100, 100);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* ── Navbar ── */}
      <nav className="bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200/60 dark:border-surface-700/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img key={theme} src={akademeeLogo} alt="Akademee" className="h-14 w-auto object-contain" />
            <ThemeLangToggles />
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-teal-950 text-white min-h-[calc(100vh-4rem)]">
        <KentePattern className="text-amber-400 opacity-20" />
        {/* Decorative orbs */}
        <div className="absolute top-32 -right-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl animate-float-slow-orb" />
        <div className="absolute bottom-20 -left-20 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl animate-float-reverse" />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative py-20 text-center">
          {/* ── Checking State ── */}
          {status === "checking" && (
            <div className="animate-fadeInUp">
              {/* Animated spinner ring */}
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-white/5 border-b-amber-300/50 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiClock className="w-8 h-8 text-amber-300 animate-pulse" />
                </div>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                {isFr ? "Vérification du paiement" : "Verifying payment"}
              </h1>
              <p className="text-primary-100/80 text-lg mb-8 max-w-md mx-auto">
                {message}
              </p>

              {/* Progress bar */}
              <div className="max-w-sm mx-auto">
                <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-primary-200/50 mt-3">
                  {isFr ? `Vérification ${attempts}/${MAX_ATTEMPTS}` : `Check ${attempts}/${MAX_ATTEMPTS}`}
                </p>
              </div>

              {/* Steps */}
              <div className="mt-10 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-primary-200/60">
                  <span className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <FiCheck className="w-3 h-3 text-amber-300" />
                  </span>
                  {isFr ? "Paiement envoyé" : "Payment sent"}
                </div>
                <div className="flex items-center gap-2 text-primary-200/60">
                  <span className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center animate-pulse">
                    <FiLoader className="w-3 h-3 text-amber-300 animate-spin" />
                  </span>
                  {isFr ? "Vérification Fapshi" : "Fapshi verification"}
                </div>
                <div className="flex items-center gap-2 text-primary-200/30">
                  <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                    <FiCheckCircle className="w-3 h-3" />
                  </span>
                  {isFr ? "Activation" : "Activation"}
                </div>
              </div>
            </div>
          )}

          {/* ── Success State ── */}
          {status === "success" && (
            <div className="animate-scaleIn">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <FiCheckCircle className="w-12 h-12 text-emerald-300" />
                </div>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                {isFr ? "Paiement confirmé !" : "Payment confirmed!"}
              </h1>
              <p className="text-primary-100/80 text-lg mb-6">
                {message}
              </p>
              <p className="text-primary-200/50 text-sm">
                {isFr ? "Redirection automatique vers le tableau de bord..." : "Redirecting to dashboard..."}
              </p>
            </div>
          )}

          {/* ── Failed State ── */}
          {status === "failed" && (
            <div className="animate-fadeInUp">
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <FiXCircle className="w-12 h-12 text-red-300" />
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                {isFr ? "Paiement échoué" : "Payment failed"}
              </h1>
              <p className="text-primary-100/80 text-lg mb-10 max-w-md mx-auto">
                {message}
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="/dashboard/trial-expired"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-primary-950 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
                >
                  <FiCreditCard className="w-4 h-4" />
                  {isFr ? "Réessayer" : "Try again"}
                </a>
                <button
                  onClick={logout}
                  className="px-6 py-3.5 border-2 border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  {isFr ? "Se déconnecter" : "Log out"}
                </button>
              </div>
            </div>
          )}

          {/* ── Error State (webhook pending) ── */}
          {status === "error" && (
            <div className="animate-fadeInUp">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiRefreshCw className="w-10 h-10 text-amber-300" />
                </div>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                {isFr ? "Vérification en attente" : "Verification pending"}
              </h1>
              <p className="text-primary-100/80 text-lg mb-10 max-w-md mx-auto">
                {message}
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={handleManualConfirm}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-primary-950 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  {isFr ? "Vérifier le paiement" : "Verify payment"}
                </button>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  {isFr ? "Aller au tableau de bord" : "Go to dashboard"}
                  <FiArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Trust signals */}
              <div className="mt-12 flex justify-center gap-8 text-sm text-primary-200/40">
                <span className="inline-flex items-center gap-1.5">
                  <FiShield className="w-4 h-4" />
                  {isFr ? "Paiement sécurisé" : "Secure payment"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FiCreditCard className="w-4 h-4" />
                  Fapshi
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white dark:bg-surface-800/50 border-t border-surface-200/60 dark:border-surface-700/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img key={theme} src={akademeeLogo} alt="Akademee" className="h-10 w-auto mx-auto mb-4 opacity-50" />
          <p className="text-sm text-surface-400">
            © {new Date().getFullYear()} Akademee — {isFr ? "La gestion scolaire au Cameroun" : "School management in Cameroon"}
          </p>
        </div>
      </footer>
    </div>
  );
}
