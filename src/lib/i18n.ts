import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Initialize i18n only once. Use HTTP backend only in the browser to avoid SSR fetch errors.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next);
  
  if (typeof window !== 'undefined') {
    i18n.use(HttpBackend).use(LanguageDetector);
  }
  
  i18n.init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    load: 'languageOnly',
    supportedLngs: ['en', 'fr', 'ar'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
      parse: (data: string) => {
        const sanitized = data.replace(/^\uFEFF/, '').trim();
        return JSON.parse(sanitized);
      },
    },
  });
}

export default i18n;
