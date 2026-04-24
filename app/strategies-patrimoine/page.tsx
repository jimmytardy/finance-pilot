import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { buildRouteMetadata, metadataBaseFromEnv } from '@/lib/seo-metadata'
import { wealthStrategiesCopy } from '@/lib/i18n/wealth-strategies'
import { WealthStrategiesPage } from '@/components/wealth-strategies-page'
import { JsonLd } from '@/components/seo/json-ld'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  return buildRouteMetadata(locale, 'strategiesPatrimoine')
}

export default async function StrategiesPatrimoinePage() {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  const messages = locale === 'en' ? en : fr
  const seo = messages.seo.strategiesPatrimoine
  const copy = wealthStrategiesCopy(locale)
  const metadataBase = metadataBaseFromEnv()
  const url = metadataBase ? new URL('/strategies-patrimoine', metadataBase).toString() : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: seo.title,
    description: seo.description,
    inLanguage: locale === 'en' ? 'en-GB' : 'fr-FR',
    ...(url ? { url, mainEntityOfPage: { '@type': 'WebPage', '@id': url } } : {}),
    author: { '@type': 'Organization', name: messages.meta.appName },
    publisher: { '@type': 'Organization', name: messages.meta.appName },
    articleSection: copy.strategies.map((s) => s.title),
    keywords: seo.keywords.join(', '),
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <WealthStrategiesPage locale={locale} />
    </>
  )
}
