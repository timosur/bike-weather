import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { detectLangFromHostname } from '@/lib/domain'

import de from './locales/de.json'
import en from './locales/en.json'

// Custom detector: use hostname to determine default language
const hostnameDetector = {
  name: 'hostname',
  lookup(): string | undefined {
    return detectLangFromHostname() ?? undefined
  },
}

const languageDetector = new LanguageDetector()
languageDetector.addDetector(hostnameDetector)

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'hostname', 'navigator'],
      lookupLocalStorage: 'bike-weather:lang',
      caches: ['localStorage'],
    },
  })

export default i18n
