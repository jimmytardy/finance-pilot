'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function SiteFooter() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  const appName = t('meta.appName')

  const linkClass =
    'text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline'

  return (
    <footer className="mt-auto border-t border-border bg-muted/25">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div className="space-y-3">
            <p className="text-base font-semibold tracking-tight text-foreground">{appName}</p>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">{t('siteFooter.tagline')}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">{t('siteFooter.navTitle')}</p>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link href="/" className={cn(linkClass)}>
                  {t('siteFooter.linkHome')}
                </Link>
              </li>
              <li>
                <Link href="/simulateur" className={cn(linkClass)}>
                  {t('siteFooter.linkSimulator')}
                </Link>
              </li>
              <li>
                <Link href="/#guides" className={cn(linkClass)}>
                  {t('siteFooter.linkGuides')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold text-foreground">{t('siteFooter.infoTitle')}</p>
            <p className="mt-4 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground">
              {t('siteFooter.aboutEditorial')}
            </p>
            <p className="mt-4 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground">
              {t('siteFooter.privacyLocal')}
            </p>
            <p className="mt-4 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground">
              {t('siteFooter.cookiesNote')}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/80 pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-foreground">{t('siteFooter.copyright', { year, appName })}</p>
          <p>{t('siteFooter.rights')}</p>
        </div>
      </div>
    </footer>
  )
}
