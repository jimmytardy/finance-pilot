import type { Metadata } from 'next'
import { getServerEnv } from '@/lib/env'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

export type AppLocale = 'fr' | 'en'

export function messagesForLocale(locale: AppLocale) {
  return locale === 'en' ? en : fr
}

export function metadataBaseFromEnv(): URL | undefined {
  const raw = getServerEnv().NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) return undefined
  try {
    return new URL(raw.endsWith('/') ? raw : `${raw}/`)
  } catch {
    return undefined
  }
}

const ROUTE_PATHS = {
  donnees: '/donnees',
  gestionFinances: '/gestion-finances',
  estimations: '/estimations',
  comparaison: '/comparaison',
} as const

export type RouteSeoKey = keyof typeof ROUTE_PATHS

export function buildRouteMetadata(locale: AppLocale, routeKey: RouteSeoKey): Metadata {
  const messages = messagesForLocale(locale)
  const seo = messages.seo[routeKey]
  const path = ROUTE_PATHS[routeKey]
  const metadataBase = metadataBaseFromEnv()
  const canonical = metadataBase ? new URL(path, metadataBase).toString() : undefined
  const brand = messages.meta.appName

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: seo.title,
    description: seo.description,
    keywords: [...seo.keywords],
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: `${seo.title} | ${brand}`,
      description: seo.description,
      type: 'website',
      siteName: brand,
      ...(canonical ? { url: canonical } : {}),
      locale: locale === 'en' ? 'en_US' : 'fr_FR',
    },
    twitter: {
      card: 'summary',
      title: `${seo.title} | ${brand}`,
      description: seo.description,
    },
    robots: { index: true, follow: true },
  }
}
