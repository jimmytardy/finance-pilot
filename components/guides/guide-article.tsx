import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { AppLocale } from '@/lib/seo-metadata'
import type { GuideArticleBody } from '@/lib/i18n/guides/article-types'
import { guidesChromeCopy } from '@/lib/i18n/guides/chrome'

type GuideArticleProps = {
  locale: AppLocale
  body: GuideArticleBody
  jsonLd: Record<string, unknown>
}

export function GuideArticle({ locale, body, jsonLd }: GuideArticleProps) {
  const c = guidesChromeCopy(locale)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-background">
        <article className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
          <header className="border-b border-border pb-8">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{body.heroTitle}</h1>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">{body.heroLead}</p>
          </header>

          <figure className="mt-10">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statique SEO, pas besoin du pipeline Image */}
            <img
              src={body.imgSrc}
              alt={body.imgAlt}
              width={800}
              height={280}
              loading="lazy"
              decoding="async"
              className="w-full rounded-xl border border-border bg-muted/30 object-contain"
            />
            {body.figureCaption ? (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">{body.figureCaption}</figcaption>
            ) : null}
          </figure>

          <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
            {body.sections.map((section, i) => (
              <section key={i} className="mb-10">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{section.title}</h2>
                <div className="mt-4 space-y-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {section.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="rounded-xl border border-border bg-card/50 px-5 py-5 sm:px-6" aria-labelledby="guide-checklist">
            <h2 id="guide-checklist" className="text-lg font-semibold tracking-tight">
              {body.checklistTitle}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {body.checklist.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <p className="mt-10 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">{body.closing}</p>

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
