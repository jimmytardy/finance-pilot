'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { UI_LANGUAGE_OPTIONS, resolveUiLanguageCode } from '@/lib/ui-languages'
import {
  ClipboardList,
  GitCompare,
  Home,
  Languages,
  LineChart,
  Menu,
  Monitor,
  Moon,
  Sun,
  Wallet,
} from 'lucide-react'
import { FinancePilotLogo } from '@/components/finance-pilot-logo'
import { SavedProjectsMenu } from '@/components/saved-projects-menu'
import { SimulatorAuthMenu } from '@/components/simulator-auth-menu'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const simulatorNavItems = [
  { href: '/', key: 'navigation.home' as const, icon: Home },
  { href: '/simulateur/donnees', key: 'navigation.data' as const, icon: ClipboardList },
  { href: '/simulateur/gestion-mensuel', key: 'navigation.advancedFinance' as const, icon: Wallet },
  { href: '/simulateur/estimations', key: 'navigation.estimates' as const, icon: LineChart },
  { href: '/simulateur/comparaison', key: 'navigation.comparison' as const, icon: GitCompare },
] as const

function isMarketingPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/guides') || pathname === '/strategies-patrimoine'
}

function navItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

const marketingQuickLinks = [
  { href: '/#guides', key: 'navigation.jumpGuides' as const },
  { href: '/#modules', key: 'navigation.jumpModules' as const },
  { href: '/strategies-patrimoine', key: 'navigation.guideWealth' as const },
] as const

function MarketingTextLink({
  href,
  label,
  active,
  onNavigate,
  className,
}: {
  href: string
  label: string
  active: boolean
  onNavigate?: () => void
  className?: string
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
        active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        className,
      )}
    >
      {label}
    </Link>
  )
}

function NavLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
  className,
}: {
  href: string
  label: string
  Icon: (typeof simulatorNavItems)[number]['icon']
  active: boolean
  onNavigate?: () => void
  className?: string
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  )
}

export function Navigation() {
  const pathname = usePathname()
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [burgerOpen, setBurgerOpen] = useState(false)
  const [themeReady, setThemeReady] = useState(false)

  const marketing = isMarketingPath(pathname)

  useEffect(() => {
    setThemeReady(true)
  }, [])

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark'] as const
    const cur = (theme ?? 'system') as (typeof order)[number]
    const i = Math.max(0, order.indexOf(cur))
    setTheme(order[(i + 1) % order.length])
  }

  /** Même icône SSR + 1er rendu client : évite l’écart du provider thème (résolution avant hydratation). */
  const ThemeIcon = !themeReady
    ? Monitor
    : theme === 'dark'
      ? Moon
      : theme === 'light'
        ? Sun
        : Monitor

  const currentLang = resolveUiLanguageCode(i18n.language)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-6">
        {marketing ? (
          <div className="flex flex-col gap-3 py-3 md:h-16 md:flex-row md:items-center md:gap-4 md:py-0">
            <div className="flex items-center justify-between gap-3 md:w-auto md:shrink-0">
              <Link
                href="/"
                className={cn(
                  'flex min-w-0 shrink-0 items-center rounded-lg outline-none transition-opacity',
                  'hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
                aria-label={t('meta.appName')}
              >
                <FinancePilotLogo />
              </Link>
              <div className="flex shrink-0 items-center gap-2 md:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  disabled={!themeReady}
                  title={t('navigation.themeCycle')}
                  aria-label={t('navigation.themeCycle')}
                  onClick={cycleTheme}
                >
                  <ThemeIcon className="h-5 w-5 shrink-0" />
                </Button>
                <Sheet open={burgerOpen} onOpenChange={setBurgerOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10" title={t('navigation.moreMenu')}>
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">{t('navigation.moreMenu')}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[min(100vw-1rem,22rem)] sm:max-w-sm">
                    <SheetHeader>
                      <SheetTitle>{t('navigation.moreMenu')}</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-2 px-2 pb-8 pt-2">
                      {pathname !== '/' ? (
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="h-12 w-full justify-start text-base">
                            <Link href="/" onClick={() => setBurgerOpen(false)}>
                              {t('navigation.home')}
                            </Link>
                          </Button>
                        </SheetClose>
                      ) : null}
                      {marketingQuickLinks.map((item) => {
                        const active =
                          item.href === '/guides'
                            ? pathname.startsWith('/guides')
                            : item.href === '/strategies-patrimoine'
                              ? pathname === '/strategies-patrimoine'
                              : false
                        return (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setBurgerOpen(false)}
                              className={cn(
                                'flex h-12 w-full items-center rounded-lg px-3 text-base font-medium transition-colors',
                                active
                                  ? 'bg-primary/15 text-primary'
                                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                              )}
                            >
                              {t(item.key)}
                            </Link>
                          </SheetClose>
                        )
                      })}
                      <SheetClose asChild>
                        <Button asChild className="h-12 w-full text-base">
                          <Link href="/simulateur" onClick={() => setBurgerOpen(false)}>
                            {t('navigation.openSimulator')}
                          </Link>
                        </Button>
                      </SheetClose>
                    </nav>
                  </SheetContent>
                </Sheet>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      title={t('navigation.languageChoice')}
                      aria-label={t('navigation.languageChoice')}
                    >
                      <Languages className="h-5 w-5 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[10rem]">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      {t('navigation.languageChoice')}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={currentLang}
                      onValueChange={(code) => {
                        void i18n.changeLanguage(code)
                      }}
                    >
                      {UI_LANGUAGE_OPTIONS.map((opt) => (
                        <DropdownMenuRadioItem key={opt.code} value={opt.code} className="text-sm">
                          {t(opt.labelKey)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="-mx-1 flex min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5 px-1 pb-0.5 md:mx-0 md:px-2 md:pb-0">
              {marketingQuickLinks.map((item) => (
                <MarketingTextLink
                  key={item.href}
                  href={item.href}
                  label={t(item.key)}
                  active={
                    item.href === '/#guides'
                      ? pathname === '/' || pathname.startsWith('/guides')
                      : item.href === '/strategies-patrimoine'
                        ? pathname === '/strategies-patrimoine'
                        : false
                  }
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:shrink-0">
              <Button asChild className="h-12 w-full text-base md:h-9 md:w-auto md:min-w-[11rem] md:px-4">
                <Link href="/simulateur">{t('navigation.openSimulator')}</Link>
              </Button>
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!themeReady}
                  title={t('navigation.themeCycle')}
                  aria-label={t('navigation.themeCycle')}
                  onClick={cycleTheme}
                >
                  <ThemeIcon className="h-5 w-5 shrink-0" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      title={t('navigation.languageChoice')}
                      aria-label={t('navigation.languageChoice')}
                    >
                      <Languages className="h-5 w-5 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[10rem]">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      {t('navigation.languageChoice')}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={currentLang}
                      onValueChange={(code) => {
                        void i18n.changeLanguage(code)
                      }}
                    >
                      {UI_LANGUAGE_OPTIONS.map((opt) => (
                        <DropdownMenuRadioItem key={opt.code} value={opt.code} className="text-sm">
                          {t(opt.labelKey)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-16 flex-wrap items-center gap-x-2 gap-y-2 py-2 md:min-h-16 md:flex-nowrap md:py-2">
            <Link
              href="/"
              className={cn(
                'flex min-w-0 shrink-0 items-center rounded-lg outline-none transition-opacity',
                'hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
              aria-label={t('meta.appName')}
            >
              <FinancePilotLogo />
            </Link>

            <div className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-1 md:flex">
              {simulatorNavItems
                .filter((item) => !(item.href === '/' && pathname === '/'))
                .map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={t(item.key)}
                    Icon={item.icon}
                    active={navItemActive(pathname, item.href)}
                  />
                ))}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <SimulatorAuthMenu />
              <SavedProjectsMenu />

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden h-9 w-9 shrink-0 md:inline-flex"
                disabled={!themeReady}
                title={t('navigation.themeCycle')}
                aria-label={t('navigation.themeCycle')}
                onClick={cycleTheme}
              >
                <ThemeIcon className="h-5 w-5 shrink-0" />
              </Button>

              <Sheet open={burgerOpen} onOpenChange={setBurgerOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 md:hidden" title={t('navigation.moreMenu')}>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">{t('navigation.moreMenu')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[min(100vw-1rem,22rem)] sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle>{t('navigation.moreMenu')}</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 px-2 pb-8 pt-2">
                    {simulatorNavItems
                      .filter((item) => !(item.href === '/' && pathname === '/'))
                      .map((item) => (
                        <SheetClose asChild key={item.href}>
                          <NavLink
                            href={item.href}
                            label={t(item.key)}
                            Icon={item.icon}
                            active={navItemActive(pathname, item.href)}
                            onNavigate={() => setBurgerOpen(false)}
                            className="py-3.5"
                          />
                        </SheetClose>
                      ))}
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">{t('navigation.themeCycle')}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        disabled={!themeReady}
                        title={t('navigation.themeCycle')}
                        aria-label={t('navigation.themeCycle')}
                        onClick={cycleTheme}
                      >
                        <ThemeIcon className="h-5 w-5 shrink-0" />
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 md:h-9 md:w-9"
                    title={t('navigation.languageChoice')}
                    aria-label={t('navigation.languageChoice')}
                  >
                    <Languages className="h-5 w-5 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {t('navigation.languageChoice')}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={currentLang}
                    onValueChange={(code) => {
                      void i18n.changeLanguage(code)
                    }}
                  >
                    {UI_LANGUAGE_OPTIONS.map((opt) => (
                      <DropdownMenuRadioItem key={opt.code} value={opt.code} className="text-sm">
                        {t(opt.labelKey)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
