import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { buildRouteMetadata, messagesForLocale } from '@/lib/seo-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  return buildRouteMetadata(locale, 'simulateur')
}

export default async function SimulateurHubPage() {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  const messages = messagesForLocale(locale)
  const s = messages.simulateurPage

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="border-b border-border bg-gradient-to-b from-accent/20 to-background">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 md:px-8 md:pb-20 md:pt-14">
          <p className="mb-6 sm:mb-8">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'h-11 gap-2 px-2 text-base text-muted-foreground hover:text-foreground sm:h-10 sm:text-sm',
              )}
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {s.backToHome}
            </Link>
          </p>
          <header className="mx-auto max-w-2xl text-center md:max-w-3xl">
            <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {s.heroTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-prose text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {s.heroLead}
            </p>
          </header>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20">
        <h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">{s.sectionsTitle}</h2>
        <ul className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {s.featureCards.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="h-full border-border/80 transition-colors group-hover:border-primary/40 group-hover:bg-card/80">
                  <CardHeader className="space-y-3 p-6 sm:p-7">
                    <CardTitle className="flex items-start justify-between gap-3 text-lg leading-snug sm:text-xl">
                      <span className="text-balance">{card.title}</span>
                      <ArrowRight
                        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden
                      />
                    </CardTitle>
                    <CardDescription className="text-pretty text-base leading-relaxed">{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0 sm:px-7 sm:pb-7">
                    <span className="text-sm font-medium text-primary">{card.href}</span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
