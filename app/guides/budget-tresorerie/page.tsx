import { headers } from 'next/headers'
import { GuideArticle } from '@/components/guides/guide-article'
import { pickArticle } from '@/lib/i18n/guides/article-types'
import { budgetTresorerieArticle } from '@/lib/i18n/guides/budget-tresorerie'
import { buildGuideArticleJsonLd } from '@/lib/guide-jsonld'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { messagesForLocale } from '@/lib/seo-metadata'

export default async function BudgetTresoreriePage() {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  const messages = messagesForLocale(locale)
  const seo = messages.seo.guidesBudgetTresorerie
  const body = pickArticle(budgetTresorerieArticle, locale)
  const jsonLd = buildGuideArticleJsonLd({
    locale,
    path: '/guides/budget-tresorerie',
    seo,
    appName: messages.meta.appName,
  })
  return <GuideArticle locale={locale} body={body} jsonLd={jsonLd} />
}
