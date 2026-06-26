import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enOnboarding from "./locales/en/onboarding.json";
import enDashboard from "./locales/en/dashboard.json";
import enLanding from "./locales/en/landing.json";
import frCommon from "./locales/fr/common.json";
import frAuth from "./locales/fr/auth.json";
import frOnboarding from "./locales/fr/onboarding.json";
import frDashboard from "./locales/fr/dashboard.json";
import frLanding from "./locales/fr/landing.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        onboarding: enOnboarding,
        dashboard: enDashboard,
        landing: enLanding,
      },
      fr: {
        common: frCommon,
        auth: frAuth,
        onboarding: frOnboarding,
        dashboard: frDashboard,
        landing: frLanding,
      },
    },
    ns: ["common", "auth", "onboarding", "dashboard", "landing"],
    defaultNS: "common",
  });

export default i18n;
