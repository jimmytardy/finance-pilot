import type { AppLocale } from '@/lib/seo-metadata'
import { metadataBaseFromEnv } from '@/lib/seo-metadata'

type SeoBlock = { title: string; description: string; keywords: string[] }

export function buildGuideArticleJsonLd(options: {
  locale: AppLocale
  path: string
  seo: SeoBlock
  appName: string
}): Record<string, unknown> {
  const { locale, path, seo, appName } = options
  const metadataBase = metadataBaseFromEnv()
  const url = metadataBase ? new URL(path, metadataBase).toString() : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: seo.title,
    description: seo.description,
    keywords: seo.keywords.join(', '),
    inLanguage: locale === 'en' ? 'en-GB' : 'fr-FR',
    author: { '@type': 'Organization', name: appName },
    publisher: { '@type': 'Organization', name: appName },
    ...(url ? { url, mainEntityOfPage: { '@type': 'WebPage', '@id': url } } : {}),
  }
}

export function buildGuidesHubJsonLd(options: {
  locale: AppLocale
  seo: SeoBlock
  appName: string
  partUrls: { name: string; path: string }[]
}): Record<string, unknown> {
  const { locale, seo, appName, partUrls } = options
  const metadataBase = metadataBaseFromEnv()
  const collectionUrl = metadataBase ? `${new URL('/', metadataBase).toString()}#guides` : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: seo.title,
    description: seo.description,
    inLanguage: locale === 'en' ? 'en-GB' : 'fr-FR',
    isPartOf: { '@type': 'WebSite', name: appName },
    ...(collectionUrl ? { url: collectionUrl } : {}),
    hasPart: partUrls.map((p) => ({
      '@type': 'WebPage',
      name: p.name,
      ...(metadataBase ? { url: new URL(p.path, metadataBase).toString() } : { url: p.path }),
    })),
  }
}
