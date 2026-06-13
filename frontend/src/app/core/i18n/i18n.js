import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: { common: enCommon, auth: enAuth },
      fr: { common: frCommon, auth: frAuth },
    },
    ns: ['common', 'auth'],
    defaultNS: 'common',
  });

export default i18n;