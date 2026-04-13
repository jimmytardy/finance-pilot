'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { StrategyProfileQuizModel } from '@/lib/i18n/guides/strategy-profile-quiz'
import {
  computeStrategyProfileRecommendations,
  strategyProfileArticleHash,
} from '@/lib/i18n/guides/strategy-profile-quiz'
import { guidesChromeCopy } from '@/lib/i18n/guides/chrome'
import type { AppLocale } from '@/lib/seo-metadata'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

const ARTICLE_PATH = '/guides/7-strategies-gestion-argent'

type StrategyProfileQuizPanelProps = {
  locale: AppLocale
  model: StrategyProfileQuizModel
  strategyTitles: readonly string[]
}

export function StrategyProfileQuizPanel({ locale, model, strategyTitles }: StrategyProfileQuizPanelProps) {
  const chrome = guidesChromeCopy(locale)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>(() => model.questions.map(() => -1))
  const [showResult, setShowResult] = useState(false)

  const q = model.questions[step]
  const total = model.questions.length
  const currentAnswer = answers[step]
  const canAdvance = currentAnswer >= 0 && currentAnswer < q.options.length

  const { recommendedIndices } = useMemo(() => {
    if (!showResult) return { recommendedIndices: [] as readonly number[] }
    return computeStrategyProfileRecommendations(model.questions, answers)
  }, [showResult, model.questions, answers])

  const progressText = model.progressLabel
    .replace('{{current}}', String(Math.min(step + 1, total)))
    .replace('{{total}}', String(total))

  const goNext = () => {
    if (step < total - 1) setStep((s) => s + 1)
    else setShowResult(true)
  }

  const goBack = () => {
    if (showResult) {
      setShowResult(false)
      setStep(total - 1)
      return
    }
    if (step > 0) setStep((s) => s - 1)
  }

  const restart = () => {
    setStep(0)
    setAnswers(model.questions.map(() => -1))
    setShowResult(false)
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="border-b border-border bg-gradient-to-b from-accent/20 to-background">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="mb-6">
            <Link
              href="/#guides"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'h-11 gap-2 px-2 text-base text-muted-foreground hover:text-foreground sm:h-10 sm:text-sm',
              )}
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {chrome.backToGuides}
            </Link>
          </p>
          <header>
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{model.heroTitle}</h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">{model.heroLead}</p>
          </header>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
        {!showResult ? (
          <Card className="border-border/80 p-6 sm:p-8">
            <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
              {progressText}
            </p>
            <h2 id={`quiz-q-${step}`} className="mt-4 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {q.prompt}
            </h2>
            <div className="mt-6 cursor-pointer space-y-3" role="radiogroup" aria-labelledby={`quiz-q-${step}`}>
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={currentAnswer === i}
                  onClick={() => {
                    setAnswers((prev) => {
                      const next = [...prev]
                      next[step] = i
                      return next
                    })
                  }}
                  className={cn(
                    'flex w-full cursor-pointer text-left rounded-lg border border-border p-4 text-sm leading-relaxed transition-colors sm:text-base',
                    currentAnswer === i ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'hover:border-primary/25',
                  )}
                >
                  <span
                    className={cn(
                      'mr-3 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                      currentAnswer === i ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                    )}
                    aria-hidden
                  >
                    {currentAnswer === i ? <span className="size-1.5 rounded-full bg-primary-foreground" /> : null}
                  </span>
                  <span className="text-pretty text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {step > 0 ? (
                <button type="button" onClick={goBack} className={cn(buttonVariants({ variant: 'outline' }), 'min-w-[7rem]')}>
                  {model.back}
                </button>
              ) : null}
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                className={cn(buttonVariants(), 'min-w-[7rem] gap-2 disabled:cursor-not-allowed')}
              >
                {step < total - 1 ? (
                  <>
                    {model.next}
                    <ArrowRight className="size-4 shrink-0" aria-hidden />
                  </>
                ) : (
                  <>
                    {model.seeResult}
                    <ArrowRight className="size-4 shrink-0" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </Card>
        ) : (
          <Card className="border-border/80 p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{model.resultTitle}</h2>
            <p className="mt-3 text-pretty text-muted-foreground">{model.resultLead}</p>
            <ol className="mt-8 list-decimal space-y-8 pl-5 marker:font-semibold marker:text-muted-foreground">
              {recommendedIndices.map((idx) => (
                <li key={idx} className="pl-2">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-pretty text-base font-semibold leading-snug text-foreground sm:text-lg">
                        {strategyTitles[idx]}
                      </h3>
                      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {model.resultBlurbs[idx]}
                      </p>
                    </div>
                    <Link
                      href={`${ARTICLE_PATH}${strategyProfileArticleHash(idx)}`}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'shrink-0 gap-2 self-start sm:self-center',
                      )}
                    >
                      {model.resultReadInGuide}
                      <ArrowRight className="size-4 shrink-0" aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:flex-wrap">
              <Link href={ARTICLE_PATH} className={cn(buttonVariants(), 'gap-2')}>
                {model.resultOpenFullGuide}
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
              <Link href="/simulateur" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
                {model.resultOpenSimulator}
                <ArrowRight className="size-4 shrink-0 opacity-70" aria-hidden />
              </Link>
              <button type="button" onClick={goBack} className={cn(buttonVariants({ variant: 'outline' }))}>
                {model.back}
              </button>
              <button type="button" onClick={restart} className={cn(buttonVariants({ variant: 'ghost' }))}>
                {model.restart}
              </button>
            </div>
            <p className="mt-8 text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm">{model.disclaimer}</p>
          </Card>
        )}
      </div>
    </main>
  )
}
