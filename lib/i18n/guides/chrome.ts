import type { AppLocale } from '@/lib/seo-metadata'

export type GuidesChromeCopy = {
  ctaSimulator: string
  ctaMonthly: string
  home: string
  backToGuides: string
}

const fr: GuidesChromeCopy = {
  ctaSimulator: 'Accéder au simulateur',
  ctaMonthly: 'Gestion mensuelle',
  home: 'Accueil',
  backToGuides: 'Retour aux guides (accueil)',
}

const en: GuidesChromeCopy = {
  ctaSimulator: 'Open the simulator',
  ctaMonthly: 'Monthly management',
  home: 'Home',
  backToGuides: 'Back to guides (home)',
}

export function guidesChromeCopy(locale: AppLocale): GuidesChromeCopy {
  return locale === 'en' ? en : fr
}
