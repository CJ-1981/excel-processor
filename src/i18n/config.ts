import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import ko from './locales/ko.json';

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko }
    },
    fallbackLng: 'en', // Default language
    lng: localStorage.getItem('excel-processor-language') || 'en', // Load saved language or default to English

    interpolation: {
      escapeValue: false // React already escapes values
    },

    react: {
      useSuspense: false // Disable Suspense for simplicity
    },

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Cache user language
      caches: ['localStorage'],
      lookupLocalStorage: 'excel-processor-language'
    }
  });

export default i18n;
