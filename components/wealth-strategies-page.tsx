import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { AppLocale } from '@/lib/seo-metadata'
import { wealthStrategiesCopy } from '@/lib/i18n/wealth-strategies'
import { Navigation } from '@/components/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

type WealthStrategiesPageProps = {
  locale: AppLocale
  jsonLd: Record<string, unknown>
}

export function WealthStrategiesPage({ locale, jsonLd }: WealthStrategiesPageProps) {
  const brand = locale === 'en' ? en.meta.appName : fr.meta.appName
  const seo = locale === 'en' ? en.seo.strategiesPatrimoine : fr.seo.strategiesPatrimoine
  const copy = wealthStrategiesCopy(locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navigation />
      <main className="min-h-screen bg-background">
        <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="border-b border-border pb-8">
            <p className="text-sm font-medium text-primary">{brand}</p>
            <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">{copy.heroLead}</p>
          </header>

          <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
            {copy.intro.map((p, i) => (
              <p key={i} className="text-pretty leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </div>

          <ol className="mt-12 space-y-12">
            {copy.strategies.map((s, index) => (
              <li key={s.title} className="scroll-mt-24">
                <section aria-labelledby={`strategy-${index}-title`}>
                  <h2 id={`strategy-${index}-title`} className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>
                    {s.title}
                  </h2>
                  <p className="mt-3 text-pretty font-medium text-foreground/90">{s.summary}</p>
                  <div className="mt-4 space-y-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {s.paragraphs.map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                </section>
              </li>
            ))}
          </ol>

          <section className="mt-14 rounded-xl border border-border bg-card/60 px-5 py-6 sm:px-6" aria-labelledby="how-to-use-heading">
            <h2 id="how-to-use-heading" className="text-lg font-semibold tracking-tight">
              {copy.howToUseTitle}
            </h2>
            <div className="mt-3 space-y-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.howToUseBody.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/simulateur/donnees" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
                {copy.ctaLabel}
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </section>

          <aside
            className="mt-10 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100"
            role="note"
          >
            <p className="font-semibold">{copy.disclaimerTitle}</p>
            <p className="mt-1 text-pretty opacity-95">{copy.disclaimerBody}</p>
          </aside>

          <footer className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            <span>{seo.title}</span>
          </footer>
        </article>
      </main>
    </>
  )
}
