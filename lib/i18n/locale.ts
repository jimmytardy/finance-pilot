import type { TFunction } from 'i18next'

/** Locale BCP 47 pour Intl (nombres, dates). */
export function numberLocaleForLanguage(lng: string): string {
  return lng === 'en' ? 'en-GB' : 'fr-FR'
}

export function formatCurrencyAmount(amount: number, lng: string): string {
  return new Intl.NumberFormat(numberLocaleForLanguage(lng), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompactAmount(amount: number, lng: string): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k`
  return amount.toFixed(0)
}

/** Libellés d’axe pour les années de projection (0 = maintenant). */
export function projectionYearLabel(t: TFunction, year: number): string {
  if (year === 0) return t('time.now')
  return t('time.years', { count: year })
}
