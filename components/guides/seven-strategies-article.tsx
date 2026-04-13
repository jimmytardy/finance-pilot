import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { AppLocale } from '@/lib/seo-metadata'
import type { SevenStrategiesCopy } from '@/lib/i18n/guides/sept-strategies-argent'
import { guidesChromeCopy } from '@/lib/i18n/guides/chrome'

type SevenStrategiesArticleProps = {
  locale: AppLocale
  copy: SevenStrategiesCopy
  jsonLd: Record<string, unknown>
}

export function SevenStrategiesArticle({ locale, copy, jsonLd }: SevenStrategiesArticleProps) {
  const c = guidesChromeCopy(locale)
  const L = copy.labels

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-background">
        <article className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
          <header className="border-b border-border pb-8">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{copy.heroTitle}</h1>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">{copy.heroLead}</p>
          </header>

          <div className="mt-12 space-y-14">
            {copy.strategies.map((s, i) => (
              <section key={i} className="scroll-mt-24" aria-labelledby={`strat-${i}-title`}>
                <h2 id={`strat-${i}-title`} className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {s.title}
                </h2>
                <div className="mt-5 space-y-4 text-pretty text-sm leading-relaxed sm:text-base">
                  <div>
                    <h3 className="font-semibold text-foreground">{L.interest}</h3>
                    <p className="mt-1 text-muted-foreground">{s.interest}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{L.profile}</h3>
                    <p className="mt-1 text-muted-foreground">{s.profile}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{L.advantages}</h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
                      {s.advantages.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{L.sacrifices}</h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
                      {s.sacrifices.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-16 border-t border-border pt-12" aria-labelledby="conclusion-title">
            <h2 id="conclusion-title" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {copy.conclusionTitle}
            </h2>
            <div className="mt-4 space-y-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.conclusionParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-primary/25 bg-primary/5 px-5 py-5 sm:px-6">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{copy.recommendationTitle}</h3>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                {copy.recommendationBody}
              </p>
            </div>
          </section>

          <nav className="mt-12 border-t border-border pt-8">
            <Link
              href="/#guides"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {c.backToGuides}
            </Link>
          </nav>
        </article>
      </main>
    </>
  )
}
