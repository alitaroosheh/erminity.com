import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import ar from './locales/ar.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'fr', 'ar'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
    },
  })

export default i18n

export function isRtl(lng: string) {
  return lng === 'ar'
}
