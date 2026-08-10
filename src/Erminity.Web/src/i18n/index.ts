import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import ar from './locales/ar.json'
import fa from './locales/fa.json'

export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'ar', 'fa'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      ar: { translation: ar },
      fa: { translation: fa },
    },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    interpolation: { escapeValue: false },
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
    },
  })

export default i18n

export function isRtl(lng: string) {
  return lng === 'ar' || lng === 'fa'
}
