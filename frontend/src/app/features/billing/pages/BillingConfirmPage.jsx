import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import api from "../../../core/api/axios";
import { useBrandLogo } from "../../../core/hooks/useBrandLogo";
import { FiCheckCircle, FiLoader, FiXCircle, FiRefreshCw } from "react-icons/fi";

/**
 * BillingConfirmPage — displayed after the user returns from Fapshi checkout.
 *
 * Flow:
 * 1. User pays on Fapshi checkout page
 * 2. Fapshi redirects here AND sends a webhook to /api/billing/fapshi/webhook
 * 3. Webhook handler verifies with Fapshi API → updates payment → calls upgradePlan
 * 4. This page polls /api/billing/payment-status until subscription status is 'active'
 * 5. Then redirects to dashboard
 */
export default function BillingConfirmPage() {
  const { refreshUser, logout } = useAuth();
  const { i18n } = useTranslation("landing");
  const isFr = i18n.language === "fr";
  const akademeeLogo = useBrandLogo();
  const [status, setStatus] = useState("checking"); // checking | success | failed | error
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState(
    isFr
      ? "Vérification de votre paiement en cours..."
      : "Verifying your payment..."
  );

  const POLL_INTERVAL = 3000; // 3 seconds
  const MAX_ATTEMPTS = 20; // 60 seconds max

  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.BILLING.PAYMENT_STATUS);
      const { subscription, payments } = res.data.data || {};

      if (subscription?.status === "active") {
        setStatus("success");
        setMessage(
          isFr
            ? "Paiement confirmé ! Redirection vers votre tableau de bord..."
            : "Payment confirmed! Redirecting to your dashboard..."
        );
        // Refresh user data to get new plan info
        await refreshUser();
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
        return true;
      }

      // Check if any payment failed or expired
      const latestPayment = payments?.[0];
      if (latestPayment?.status === "failed" || latestPayment?.status === "expired") {
        setStatus("failed");
        setMessage(
          isFr
            ? "Le paiement a échoué ou a expiré. Veuillez réessayer."
            : "Payment failed or expired. Please try again."
        );
        return true;
      }

      return false;
    } catch (err) {
      console.error("Payment status check failed:", err);
      return false;
    }
  }, [isFr, refreshUser]);

  useEffect(() => {
    let intervalId;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      setAttempts(attempts);

      const done = await checkPaymentStatus();
      if (done || attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        if (attempts >= MAX_ATTEMPTS && status === "checking") {
          setStatus("error");
          setMessage(
            isFr
              ? "La vérification prend plus de temps que prévu. Veuillez patienter ou contacter le support."
              : "Verification is taking longer than expected. Please wait or contact support."
          );
        }
      }
    };

    // Initial check
    poll();
    intervalId = setInterval(poll, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [checkPaymentStatus, isFr, status]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <img
          src={akademeeLogo}
          alt="Akademee"
          className="h-14 w-auto mx-auto mb-8"
        />

        {status === "checking" && (
          <div className="animate-fadeIn">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              {isFr ? "Paiement en cours de vérification" : "Verifying payment"}
            </h2>
            <p className="text-surface-500 mb-4">{message}</p>
            <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((attempts / MAX_ATTEMPTS) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-surface-400 mt-2">
              {isFr
                ? `Vérification ${attempts}/${MAX_ATTEMPTS}...`
                : `Check ${attempts}/${MAX_ATTEMPTS}...`}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              {isFr ? "Paiement confirmé !" : "Payment confirmed!"}
            </h2>
            <p className="text-surface-500">{message}</p>
          </div>
        )}

        {status === "failed" && (
          <div className="animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiXCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              {isFr ? "Paiement échoué" : "Payment failed"}
            </h2>
            <p className="text-surface-500 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <a
                href="/trial-expired"
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {isFr ? "Réessayer" : "Try again"}
              </a>
              <button
                onClick={logout}
                className="px-6 py-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 text-sm font-semibold rounded-xl transition-colors"
              >
                {isFr ? "Se déconnecter" : "Log out"}
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="animate-fadeIn">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiRefreshCw className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              {isFr ? "Vérification en cours" : "Verification pending"}
            </h2>
            <p className="text-surface-500 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setStatus("checking");
                  setAttempts(0);
                }}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {isFr ? "Revérifier" : "Check again"}
              </button>
              <a
                href="/dashboard"
                className="px-6 py-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 text-sm font-semibold rounded-xl transition-colors"
              >
                {isFr ? "Aller au tableau de bord" : "Go to dashboard"}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
