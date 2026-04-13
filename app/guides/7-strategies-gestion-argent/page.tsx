import { headers } from 'next/headers'
import { SevenStrategiesArticle } from '@/components/guides/seven-strategies-article'
import { buildGuideArticleJsonLd } from '@/lib/guide-jsonld'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { messagesForLocale } from '@/lib/seo-metadata'
import { sevenStrategiesCopy } from '@/lib/i18n/guides/sept-strategies-argent'

export default async function SeptStrategiesPage() {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  const messages = messagesForLocale(locale)
  const seo = messages.seo.guidesSeptStrategies
  const copy = sevenStrategiesCopy(locale)
  const jsonLd: Record<string, unknown> = {
    ...buildGuideArticleJsonLd({
      locale,
      path: '/guides/7-strategies-gestion-argent',
      seo,
      appName: messages.meta.appName,
    }),
    articleSection: [copy.heroTitle, ...copy.strategies.map((s) => s.title), copy.conclusionTitle],
  }
  return <SevenStrategiesArticle locale={locale} copy={copy} jsonLd={jsonLd} />
}
