import { useTranslation } from "react-i18next";
import { useAuth } from "../../core/hooks/useAuth";
import { FiAlertTriangle, FiClock, FiArrowRight } from "react-icons/fi";

/**
 * TrialBanner — shown at the top of the dashboard when a school is on trial.
 * Displays remaining days and an upgrade CTA.
 * Color-coded: green (>7 days), yellow (3-7 days), red (≤2 days).
 */
export default function TrialBanner() {
  const { trialInfo } = useAuth();
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";

  if (!trialInfo || trialInfo.status !== "trial" || trialInfo.expired) {
    return null;
  }

  const remaining = trialInfo.remainingDays;
  let bgColor, textColor, borderColor, iconColor;

  if (remaining > 7) {
    bgColor = "bg-emerald-50 dark:bg-emerald-900/20";
    textColor = "text-emerald-800 dark:text-emerald-200";
    borderColor = "border-emerald-200 dark:border-emerald-800";
    iconColor = "text-emerald-600";
  } else if (remaining > 2) {
    bgColor = "bg-amber-50 dark:bg-amber-900/20";
    textColor = "text-amber-800 dark:text-amber-200";
    borderColor = "border-amber-200 dark:border-amber-800";
    iconColor = "text-amber-600";
  } else {
    bgColor = "bg-red-50 dark:bg-red-900/20";
    textColor = "text-red-800 dark:text-red-200";
    borderColor = "border-red-200 dark:border-red-800";
    iconColor = "text-red-600";
  }

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-xl px-4 py-3 flex items-center justify-between gap-4 mb-4`}
    >
      <div className="flex items-center gap-3">
        {remaining <= 2 ? (
          <FiAlertTriangle className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        ) : (
          <FiClock className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        )}
        <p className={`text-sm font-medium ${textColor}`}>
          {remaining <= 1
            ? isFr
              ? `Votre essai gratuit expire ${remaining === 0 ? "aujourd'hui" : "demain"}.`
              : `Your free trial expires ${remaining === 0 ? "today" : "tomorrow"}.`
            : isFr
              ? `Essai gratuit — ${remaining} jours restants.`
              : `Free trial — ${remaining} days remaining.`}
        </p>
      </div>
      <a
        href="/trial-expired"
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 ${
          remaining <= 2
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-emerald-800 hover:bg-emerald-700 text-white"
        }`}
      >
        {isFr ? "Upgrade" : "Upgrade"}
        <FiArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}
