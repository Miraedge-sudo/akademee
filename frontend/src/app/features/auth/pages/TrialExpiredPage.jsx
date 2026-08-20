import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { API_ENDPOINTS } from "../../../core/api/endpoints";
import api from "../../../core/api/axios";
import { useBrandLogo } from "../../../core/hooks/useBrandLogo";
import {
  FiCheck,
  FiCreditCard,
  FiLoader,
  FiArrowRight,
  FiClock,
  FiShield,
  FiSmartphone,
  FiZap,
  FiUsers,
  FiTrendingUp,
  FiAward,
} from "react-icons/fi";

// ── Plans matching the landing page #pricing section ──
const PLANS = [
  {
    name: "Basic",
    price: 180000,
    period: "FCFA / year",
    features: {
      en: [
        "Up to 300 students",
        "Core academics & grading",
        "1 website template",
        "Email support",
        "Public website",
      ],
      fr: [
        "Jusqu'à 300 élèves",
        "Académique & notation",
        "1 modèle de site web",
        "Support email",
        "Site web public",
      ],
    },
    code: "basic",
  },
  {
    name: "Premium",
    price: 360000,
    period: "FCFA / year",
    features: {
      en: [
        "Up to 1,500 students",
        "Finance & payroll suite",
        "All 3 website templates",
        "Live chat support",
        "Bulk import (Excel/CSV)",
        "Custom branding",
      ],
      fr: [
        "Jusqu'à 1 500 élèves",
        "Finance & paie complètes",
        "Les 3 modèles de site web",
        "Support live chat",
        "Import en masse (Excel/CSV)",
        "Identité personnalisée",
      ],
    },
    popular: true,
    code: "premium",
  },
  {
    name: "Professional",
    price: 720000,
    period: "FCFA / year",
    features: {
      en: [
        "Unlimited students",
        "Library, transport & hostel",
        "Advanced analytics",
        "Priority support",
        "API access",
        "Multi-campus",
      ],
      fr: [
        "Élèves illimités",
        "Bibliothèque, transport & internat",
        "Analyses avancées",
        "Support prioritaire",
        "Accès API",
        "Multi-campus",
      ],
    },
    code: "professional",
  },
];

// ── Kente pattern SVG (African textile motif) ──
function KentePattern({ className = "" }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id="kente-upgrade" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M32 4 L60 32 L32 60 L4 32 Z" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
          <path d="M32 18 L46 32 L32 46 L18 32 Z" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
          <rect x="0" y="0" width="8" height="64" fill="currentColor" fillOpacity="0.08" />
          <rect x="56" y="0" width="8" height="64" fill="currentColor" fillOpacity="0.08" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kente-upgrade)" />
    </svg>
  );
}

// ── Section badge (matches landing page) ──
function SectionBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-full border border-amber-300/60 dark:border-amber-700/60 uppercase tracking-wide">
      {children}
    </span>
  );
}

export default function TrialExpiredPage() {
  const { logout, user, trialInfo } = useAuth();
  const { i18n } = useTranslation("landing");
  const isFr = i18n.language === "fr";
  const lang = isFr ? "fr" : "en";
  const [initiating, setInitiating] = useState(null);
  const [error, setError] = useState(null);

  // Current plan of the school
  const currentPlan = user?.school?.subscriptionPlan || user?.subscriptionPlan || 'trial';
  const currentStatus = user?.school?.subscriptionStatus || user?.subscriptionStatus || 'trial';
  const isActivePaid = currentStatus === 'active' && currentPlan !== 'trial' && currentPlan !== 'free';

  const handleUpgrade = async (planCode) => {
    setInitiating(planCode);
    setError(null);
    try {
      const res = await api.post(API_ENDPOINTS.BILLING.INITIATE, { planCode });
      console.log("[Billing] Response:", res.data);
      const data = res.data.data;
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(res.data?.message || "No payment URL returned");
      }
    } catch (err) {
      console.error("[Billing] Payment initiation failed:", err);
      const msg = err.response?.data?.message || err.message || "Failed to initiate payment.";
      setError(msg);
      // Scroll to error so user sees it
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setInitiating(null);
    }
  };

  const remaining = trialInfo?.remainingDays ?? 0;

  // ── Benefits data ──
  const benefits = [
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: isFr ? "Équipe illimitée" : "Unlimited team",
      desc: isFr
        ? "Ajoutez autant d'enseignants et d'élèves que nécessaire"
        : "Add as many teachers and students as you need",
    },
    {
      icon: <FiTrendingUp className="w-6 h-6" />,
      title: isFr ? "Rapports avancés" : "Advanced reports",
      desc: isFr
        ? "Bulletins, relevés de notes et statistiques détaillées"
        : "Report cards, grade sheets, and detailed analytics",
    },
    {
      icon: <FiSmartphone className="w-6 h-6" />,
      title: isFr ? "Mobile Money" : "Mobile Money",
      desc: isFr
        ? "Paiement sécurisé par MTN MoMo et Orange Money"
        : "Secure payment via MTN MoMo and Orange Money",
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: isFr ? "Sécurisé" : "Secure & private",
      desc: isFr
        ? "Vos données sont chiffrées et hébergées au Cameroun"
        : "Your data is encrypted and hosted in Cameroon",
    },
    {
      icon: <FiZap className="w-6 h-6" />,
      title: isFr ? "Support prioritaire" : "Priority support",
      desc: isFr
        ? "Assistance WhatsApp directe et réponse sous 24h"
        : "Direct WhatsApp support with 24h response time",
    },
    {
      icon: <FiAward className="w-6 h-6" />,
      title: isFr ? "Sans engagement" : "No lock-in",
      desc: isFr
        ? "Changez ou annulez votre plan à tout moment"
        : "Change or cancel your plan anytime",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-teal-950 text-white rounded-2xl mb-8">
        <KentePattern className="text-amber-400 opacity-20" />
        {/* Decorative orbs */}
        <div className="absolute top-20 -right-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-float-slow-orb" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-float-reverse" />

        <div className="relative py-10 sm:py-16 lg:py-20 text-center px-4 sm:px-8">
          {/* Current plan badge — always visible */}
          <div className="animate-fadeInUp inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-amber-300 text-sm font-semibold rounded-full mb-4">
            <FiClock className="w-4 h-4" />
            {isActivePaid
              ? isFr
                ? `Plan actuel : ${currentPlan}`
                : `Current plan: ${currentPlan}`
              : isFr
                ? `Essai — ${remaining} jour${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}`
                : `Trial — ${remaining} day${remaining > 1 ? "s" : ""} left`}
          </div>

          {/* Prominent current plan card */}
          <div className="animate-fadeInUp animate-fadeInUp-delay-1 inline-flex items-center gap-3 px-5 py-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FiAward className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="text-left">
              <p className="text-xs text-primary-200/70 uppercase tracking-wide font-medium">
                {isFr ? "Votre plan" : "Your plan"}
              </p>
              <p className="text-lg font-bold text-white capitalize">
                {currentPlan === "trial" ? (isFr ? "Essai gratuit" : "Free trial") : currentPlan}
              </p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="animate-fadeInUp animate-fadeInUp-delay-1 font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            {isActivePaid && (isFr ? "Upgradez votre plan" : "Upgrade your plan")}
            {!isActivePaid && isFr && (<>Votre essai gratuit{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400">a expiré</span></>)}
            {!isActivePaid && !isFr && (<>Your free trial{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400">has expired</span></>)}
          </h1>

          <p className="animate-fadeInUp animate-fadeInUp-delay-2 text-sm sm:text-lg text-primary-100/80 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            {isActivePaid && (isFr
              ? `Bonjour ${user?.firstName || ""}, votre école ${user?.school?.name || ""} est actuellement sur le plan ${currentPlan}. Choisissez un plan supérieur pour débloquer plus de fonctionnalités.`
              : `Hello ${user?.firstName || ""}, your school ${user?.school?.name || ""} is on the ${currentPlan} plan. Choose a higher plan to unlock more features.`
            )}
            {!isActivePaid && (isFr
              ? `Bonjour ${user?.firstName || ""}, votre essai de 10 jours pour ${user?.school?.name || "votre établissement"} est terminé. Choisissez un plan pour continuer à gérer ${user?.school?.name || "votre école"} avec Akademee.`
              : `Hello ${user?.firstName || ""}, your 10-day trial for ${user?.school?.name || "your school"} has ended. Choose a plan to keep managing ${user?.school?.name || "your school"} with Akademee.`
            )}
          </p>

          {/* Payment methods badge */}
          <div className="animate-fadeInUp animate-fadeInUp-delay-3 flex flex-wrap justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400 text-yellow-950 text-sm font-bold shadow-lg shadow-yellow-400/20">
              <span className="w-5 h-5 rounded-full bg-yellow-600 flex items-center justify-center text-[10px] font-black text-white">M</span>
              MTN MoMo
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20">
              <span className="w-5 h-5 rounded-full bg-orange-700 flex items-center justify-center text-[10px] font-black text-white">O</span>
              Orange Money
            </span>
          </div>
        </div>

        {/* Decorative bottom bar — Akademee tricolor */}
        <div className="relative h-1.5 flex">
          <div className="flex-1 bg-teal-500" />
          <div className="flex-1 bg-primary-600" />
          <div className="flex-1 bg-amber-400" />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-8 animate-scaleIn">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 text-center shadow-sm">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* ── Benefits Section ── */}
      <section className="py-12">
        <div className="text-center mb-10 animate-fadeInUp">
          <SectionBadge>
            {isFr ? "Avantages" : "Benefits"}
          </SectionBadge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 mt-4 mb-3">
            {isFr ? "Pourquoi passer à Akademee Pro ?" : "Why upgrade to Akademee Pro?"}
          </h2>
          <p className="text-base text-surface-500 dark:text-surface-400 max-w-2xl mx-auto">
            {isFr
              ? "Débloquez tout le potentiel de votre établissement avec nos fonctionnalités premium."
              : "Unlock your school's full potential with our premium features."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {benefits.map((item, i) => (
            <div
              key={i}
              className={`animate-fadeInUp animate-fadeInUp-delay-${Math.min(i + 1, 3)} group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200/60 dark:border-surface-700/60 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 mb-3 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="font-display text-base font-semibold text-surface-900 dark:text-surface-100 mb-1.5">
                {item.title}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Plans Section ── */}
      <section className="py-12">
        <div className="text-center mb-10 animate-fadeInUp">
          <SectionBadge>
            {isFr ? "Tarification" : "Pricing"}
          </SectionBadge>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-100 mt-4 mb-3">
            {isFr ? "Choisissez votre plan" : "Choose your plan"}
          </h2>
          <p className="text-base text-surface-500 dark:text-surface-400">
            {isFr
              ? "Paiement par Mobile Money — sécurisé par Fapshi"
              : "Mobile Money payment — secured by Fapshi"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, index) => {
            const isPopular = plan.popular === true;
            return (
              <div
                key={plan.code}
                className={`animate-fadeInUp animate-fadeInUp-delay-${Math.min(index + 1, 3)} relative flex flex-col rounded-2xl border-2 transition-all duration-300 group ${
                  isPopular
                    ? "border-amber-400 dark:border-amber-500 shadow-xl shadow-amber-500/10 dark:shadow-amber-500/5 scale-[1.02] z-10"
                    : "border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg hover:shadow-primary-500/5"
                } bg-white dark:bg-surface-800`}
              >
                {/* Current plan badge */}
                {currentPlan === plan.code && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-scaleIn">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-500/30">
                      <FiCheck className="w-3.5 h-3.5" />
                      {isFr ? "Plan actuel" : "Current plan"}
                    </span>
                  </div>
                )}
                {/* Popular badge */}
                {isPopular && currentPlan !== plan.code && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-scaleIn">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-sm font-bold rounded-full shadow-lg shadow-amber-500/30">
                      <FiAward className="w-3.5 h-3.5" />
                      {isFr ? "Le plus populaire" : "Most popular"}
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-7 flex flex-col flex-1">
                  {/* Plan name */}
                  <h3 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-7">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
                      {plan.price.toLocaleString()}
                    </span>
                    <span className="text-surface-500 dark:text-surface-400 text-sm ml-2">
                      {plan.period}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-7 flex-1">
                    {plan.features[lang].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-surface-600 dark:text-surface-300">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isPopular
                            ? "bg-amber-100 dark:bg-amber-900/40"
                            : "bg-primary-100 dark:bg-primary-900/40"
                        }`}>
                          <FiCheck className={`w-3 h-3 ${isPopular ? "text-amber-700" : "text-primary-700 dark:text-primary-300"}`} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {currentPlan === plan.code ? (
                    <div className="relative w-full py-3.5 text-center text-base font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2.5">
                      <FiCheck className="w-4 h-4" />
                      {isFr ? "Plan actuel" : "Current plan"}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.code)}
                      disabled={initiating !== null}
                      className={`relative w-full py-3.5 text-center text-base font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden ${
                        isPopular
                          ? "bg-gradient-to-r from-primary-700 to-primary-800 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-700/30 hover:shadow-xl hover:shadow-primary-700/40"
                          : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-600"
                      } ${initiating !== null ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5 active:translate-y-0"}`}
                    >
                      {initiating === plan.code ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          {isFr ? "Redirection..." : "Redirecting..."}
                        </>
                      ) : (
                        <>
                          <FiCreditCard className="w-4 h-4" />
                          {isFr ? "Payer avec Mobile Money" : "Pay with Mobile Money"}
                          <FiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
