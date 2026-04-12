import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

type HomeLocale = 'fr' | 'en'

export function LandingPage({ locale }: { locale: HomeLocale }) {
  const messages = locale === 'en' ? en : fr
  const h = messages.homePage

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="border-b border-border bg-gradient-to-b from-accent/25 to-background">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
            <header className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {h.heroTitle}
              </h1>
              <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">{h.heroLead}</p>
              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/donnees"
                  className={cn(buttonVariants({ size: 'lg' }), 'gap-2 shadow-sm')}
                >
                  {h.ctaPrimary}
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </Link>
                <Link
                  href="/gestion-finances"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'gap-2')}
                >
                  {h.ctaSecondary}
                  <ArrowRight className="size-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </div>
            </header>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
          <section aria-labelledby="home-modules-heading">
            <h2 id="home-modules-heading" className="text-center text-xl font-semibold tracking-tight sm:text-2xl">
              {h.sectionsTitle}
            </h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {h.featureCards.map((card) => (
                <li key={card.href}>
                  <Link href={card.href} className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-card/80">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-start justify-between gap-2 text-lg leading-snug">
                          <span className="text-balance">{card.title}</span>
                          <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                        </CardTitle>
                        <CardDescription className="text-pretty leading-relaxed">{card.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <span className="text-sm font-medium text-primary">{card.href}</span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mx-auto mt-16 max-w-3xl rounded-xl border border-border bg-card/50 px-5 py-8 text-center sm:px-8" aria-labelledby="home-privacy-heading">
            <h2 id="home-privacy-heading" className="text-lg font-semibold tracking-tight">
              {h.privacyTitle}
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">{h.privacyText}</p>
          </section>
        </div>
      </main>
    </>
  )
}
