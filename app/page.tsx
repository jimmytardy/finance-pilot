import type { Metadata } from 'next'
import { headers } from 'next/headers'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'
import { LandingPage } from '@/components/landing-page'
import { JsonLd } from '@/components/seo/json-ld'
import { buildGuidesHubJsonLd } from '@/lib/guide-jsonld'
import { guidesHubCopy } from '@/lib/i18n/guides/hub'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { metadataBaseFromEnv, messagesForLocale } from '@/lib/seo-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const locale = resolveHomeLocale(headersList.get('accept-language'))
  const copy = locale === 'en' ? en.homePage : fr.homePage
  const metadataBase = metadataBaseFromEnv()
  const canonical = metadataBase ? new URL('/', metadataBase).toString() : undefined

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: { absolute: copy.metaTitle },
    description: copy.metaDescription,
    keywords: [...copy.keywords],
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      type: 'website',
      siteName: 'Finance Pilot',
      locale: locale === 'en' ? 'en_US' : 'fr_FR',
    },
    twitter: {
      card: 'summary',
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
    robots: { index: true, follow: true },
  }
}

export default async function HomePage() {
  const headersList = await headers()
  const locale = resolveHomeLocale(headersList.get('accept-language'))
  const metadataBase = metadataBaseFromEnv()
  const copy = locale === 'en' ? en.homePage : fr.homePage
  const messages = messagesForLocale(locale)
  const hub = guidesHubCopy(locale)
  const appUrl = metadataBase?.origin
  const pageUrl = metadataBase ? new URL('/', metadataBase).toString() : undefined

  const guidesCollectionRaw = buildGuidesHubJsonLd({
    locale,
    seo: messages.seo.guides,
    appName: messages.meta.appName,
    partUrls: hub.cards.map((c) => ({ name: c.title, path: c.href })),
  })
  const { ['@context']: _guidesContext, ...guidesCollectionNode } = guidesCollectionRaw

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Finance Pilot',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web browser',
        description: copy.metaDescription,
        featureList: copy.schemaFeatureList,
        ...(appUrl
          ? {
              url: appUrl,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
            }
          : {}),
      },
      {
        '@type': 'WebPage',
        name: copy.heroTitle,
        description: copy.metaDescription,
        inLanguage: locale === 'en' ? 'en-GB' : 'fr-FR',
        ...(pageUrl ? { url: pageUrl, isPartOf: { '@type': 'WebSite', name: 'Finance Pilot', url: appUrl } } : {}),
        keywords: copy.keywords.join(', '),
      },
      guidesCollectionNode,
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <LandingPage locale={locale} />
    </>
  )
}
