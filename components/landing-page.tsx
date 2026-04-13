import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const LandingNavigation = dynamic(() => import('@/components/landing-navigation'), {
  ssr: true,
  loading: () => (
    <div
      className="sticky top-0 z-50 min-h-16 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-hidden
    />
  ),
})
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { guidesHubCopy } from '@/lib/i18n/guides/hub'
import { cn } from '@/lib/utils'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

type HomeLocale = 'fr' | 'en'

export function LandingPage({ locale }: { locale: HomeLocale }) {
  const messages = locale === 'en' ? en : fr
  const h = messages.homePage
  const hub = guidesHubCopy(locale)
  const guides = h.guideCards

  return (
    <>
      <LandingNavigation />
      <main className="min-h-screen bg-background">
        <div className="border-b border-border bg-gradient-to-b from-accent/25 to-background">
          <div className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 md:px-8 md:pb-24 md:pt-20">
            <header className="mx-auto max-w-2xl text-center md:max-w-3xl">
              <h1 className="text-balance text-[1.65rem] font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {h.heroTitle}
              </h1>
              <p className="mx-auto mt-6 max-w-prose text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
                {h.heroLead}
              </p>
              <div className="mt-10 flex w-full max-w-lg flex-col gap-4 sm:mx-auto sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
                <Link
                  href="/simulateur"
                  className={cn(buttonVariants({ size: 'lg' }), 'h-12 gap-2 text-base shadow-sm sm:h-11')}
                >
                  {h.ctaPrimary}
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </Link>
                <Link
                  href="#guides"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 gap-2 text-base sm:h-11')}
                >
                  {h.ctaSecondary}
                  <ArrowRight className="size-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </div>
            </header>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 md:px-8 md:py-24">
          <section id="guides" aria-labelledby="home-guides-heading" className="scroll-mt-24">
            <h2
              id="home-guides-heading"
              className="text-center text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl"
            >
              {hub.heroTitle}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-pretty text-center text-base leading-relaxed text-muted-foreground sm:mt-7 sm:text-lg sm:leading-relaxed">
              {hub.heroLead}
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-center text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed md:max-w-3xl">
              {h.guidesSectionLead}
            </p>
            {/* 1 col. mobile → 2 tablette → 3 desktop (cartes plus compactes) */}
            <ul className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-x-6 gap-y-10 sm:mt-14 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 md:mt-16 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
              {guides.map((card) => (
                <li key={card.href} className="min-w-0">
                  <Link
                    href={card.href}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-primary/35 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-muted">
                      <Image
                        src={card.imageSrc}
                        alt={card.imageAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5 sm:gap-4 sm:p-6">
                      <h3 className="text-balance text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
                        {card.title}
                      </h3>
                      <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-relaxed">
                        {card.description}
                      </p>
                      <span className="mt-auto inline-flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/60 pt-3 text-xs font-medium text-primary">
                        <span className="break-all sm:break-words">{card.href}</span>
                        <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section id="modules" aria-labelledby="home-modules-heading" className="mt-20 scroll-mt-24 sm:mt-28 md:mt-32">
            <h2
              id="home-modules-heading"
              className="text-center text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl"
            >
              {h.sectionsTitle}
            </h2>
            <ul className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
              {h.featureCards.map((card) => (
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
                        <CardDescription className="text-pretty text-base leading-relaxed">
                          {card.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-0 sm:px-7 sm:pb-7">
                        <span className="text-sm font-medium text-primary">{card.href}</span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/80 bg-card/60 px-6 py-10 text-center sm:mt-24 sm:px-10 sm:py-12 md:mt-28 md:max-w-3xl"
            aria-labelledby="home-privacy-heading"
          >
            <h2 id="home-privacy-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
              {h.privacyTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-prose text-pretty text-base leading-relaxed text-muted-foreground">
              {h.privacyText}
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
