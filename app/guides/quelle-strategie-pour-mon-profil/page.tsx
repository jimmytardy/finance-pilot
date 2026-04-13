import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { StrategyProfileQuizPanel } from '@/components/guides/strategy-profile-quiz-panel'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { buildRouteMetadata } from '@/lib/seo-metadata'
import { strategyProfileQuizModel, strategyProfileResultTitles } from '@/lib/i18n/guides/strategy-profile-quiz'

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  return buildRouteMetadata(locale, 'guidesStrategieProfil')
}

export default async function StrategyProfileQuizPage() {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  const model = strategyProfileQuizModel(locale)
  const strategyTitles = strategyProfileResultTitles(locale)
  return <StrategyProfileQuizPanel locale={locale} model={model} strategyTitles={strategyTitles} />
}
