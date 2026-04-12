import type { Metadata } from 'next'
import { headers } from 'next/headers'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { LandingPage } from '@/components/landing-page'
import { metadataBaseFromEnv } from '@/lib/seo-metadata'

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
  const appUrl = metadataBase?.origin

  const jsonLd = {
    '@context': 'https://schema.org',
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
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage locale={locale} />
    </>
  )
}
