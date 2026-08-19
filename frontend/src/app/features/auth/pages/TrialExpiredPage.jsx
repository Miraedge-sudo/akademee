import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import api from "../../../core/api/axios";
import { useBrandLogo } from "../../../core/hooks/useBrandLogo";
import {
  FiAlertTriangle,
  FiCheck,
  FiCreditCard,
  FiLoader,
  FiExternalLink,
} from "react-icons/fi";

export default function TrialExpiredPage() {
  const { logout, user } = useAuth();
  const { i18n } = useTranslation("landing");
  const isFr = i18n.language === "fr";
  const akademeeLogo = useBrandLogo();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.SCHOOLS.PLANS);
        setPlans(res.data.data || []);
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleUpgrade = async (planCode) => {
    if (planCode === "trial" || planCode === "free") return;
    setInitiating(planCode);
    setError(null);
    try {
      // Call Fapshi initiation — backend looks up the amount server-side
      const res = await api.post(API_ENDPOINTS.BILLING.INITIATE, { planCode });
      const data = res.data.data;
      if (data?.paymentUrl) {
        // Redirect to Fapshi hosted checkout page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to initiate payment. Please try again."
      );
    } finally {
      setInitiating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-surface-900 dark:to-surface-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={akademeeLogo}
            alt="Akademee"
            className="h-14 w-auto mx-auto mb-6"
          />
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3">
            {isFr
              ? "Votre essai gratuit a expiré"
              : "Your free trial has expired"}
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-400 max-w-lg mx-auto">
            {isFr
              ? `Bonjour ${user?.firstName || ""}, votre essai de 10 jours pour ${user?.school?.name || "votre établissement"} est terminé. Choisissez un plan pour continuer à utiliser Akademee.`
              : `Hello ${user?.firstName || ""}, your 10-day trial for ${user?.school?.name || "your school"} has ended. Choose a plan to continue using Akademee.`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Plans */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans
              .filter((p) => p.id !== "trial" && p.id !== "free")
              .map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-6 bg-white dark:bg-surface-800 rounded-2xl border-2 flex flex-col transition-all duration-300 ${
                    plan.id === "premium"
                      ? "border-amber-400 shadow-lg shadow-amber-500/20"
                      : "border-surface-200 dark:border-surface-700"
                  }`}
                >
                  {plan.id === "premium" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white text-xs font-semibold rounded-full">
                      {isFr ? "Populaire" : "Popular"}
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-surface-900 dark:text-surface-100">
                      {plan.price?.toLocaleString()}
                    </span>
                    <span className="text-surface-500 text-sm ml-1">
                      {plan.currency} / {isFr ? "an" : "year"}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6 flex-1">
                    {(plan.features || []).map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400"
                      >
                        <FiCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={initiating !== null}
                    className={`w-full py-3 text-center text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      plan.id === "premium"
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950"
                        : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600"
                    } ${initiating !== null ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {initiating === plan.id ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        {isFr ? "Redirection..." : "Redirecting..."}
                      </>
                    ) : (
                      <>
                        <FiCreditCard className="w-4 h-4" />
                        {isFr ? "Payer avec Mobile Money" : "Pay with Mobile Money"}
                        <FiExternalLink className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={logout}
            className="text-sm text-surface-500 hover:text-red-600 transition-colors"
          >
            {isFr ? "Se déconnecter" : "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}
