import { headers } from 'next/headers'
import { GuideArticle } from '@/components/guides/guide-article'
import { pickArticle } from '@/lib/i18n/guides/article-types'
import { finances4EtapesArticle } from '@/lib/i18n/guides/finances-4-etapes'
import { buildGuideArticleJsonLd } from '@/lib/guide-jsonld'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { messagesForLocale } from '@/lib/seo-metadata'

export default async function Finances4EtapesPage() {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  const messages = messagesForLocale(locale)
  const seo = messages.seo.guidesFinances4Etapes
  const body = pickArticle(finances4EtapesArticle, locale)
  const jsonLd = buildGuideArticleJsonLd({
    locale,
    path: '/guides/finances-en-4-etapes',
    seo,
    appName: messages.meta.appName,
  })
  return <GuideArticle locale={locale} body={body} jsonLd={jsonLd} />
}
