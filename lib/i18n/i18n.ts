import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import translationFr from '@/locales/fr.json'
import translationEn from '@/locales/en.json'

export const LOCALE_STORAGE_KEY = 'finance-pilot-locale'
const LEGACY_LOCALE_STORAGE_KEY = 'budget-propulsion-locale'

export function readStoredLocale(): 'fr' | 'en' {
  if (typeof window === 'undefined') return 'fr'
  try {
    let v = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (!v) {
      v = localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY)
      if (v === 'en' || v === 'fr') {
        localStorage.setItem(LOCALE_STORAGE_KEY, v)
        localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY)
      }
    }
    if (v === 'en' || v === 'fr') return v
  } catch {
    /* ignore */
  }
  return 'fr'
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: translationFr },
      en: { translation: translationEn },
    },
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })
}

export default i18n
