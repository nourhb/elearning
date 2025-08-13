import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,
    // Only load base language (e.g., 'fr' for 'fr-FR') to avoid 404s for region-specific JSON files
    load: 'languageOnly',
    supportedLngs: ['en', 'fr', 'ar'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
      // Sanitize potential BOM or stray characters that can cause "Invalid or unexpected token"
      parse: (data: string) => {
        const sanitized = data.replace(/^\uFEFF/, '').trim();
        return JSON.parse(sanitized);
      },
    },
  });

export default i18n;
