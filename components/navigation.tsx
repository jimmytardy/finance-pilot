'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { UI_LANGUAGE_OPTIONS, resolveUiLanguageCode } from '@/lib/ui-languages'
import {
  Database,
  GitCompare,
  Languages,
  LineChart,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Sun,
  Wallet,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
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

/** Aucun lien « Accueil » : 1re entrée = Données (/donnees), icône base de données (pas maison). */
const simulatorNavItems = [
  { href: '/donnees', labelKey: 'navigation.data' as const, icon: Database },
  { href: '/gestion-mensuel', labelKey: 'navigation.advancedFinance' as const, icon: Wallet },
  { href: '/estimations', labelKey: 'navigation.estimates' as const, icon: LineChart },
  { href: '/comparaison', labelKey: 'navigation.comparison' as const, icon: GitCompare },
] as const

function navItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
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
  const { status: sessionStatus } = useSession()
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [burgerOpen, setBurgerOpen] = useState(false)
  const [themeReady, setThemeReady] = useState(false)

  useEffect(() => {
    setThemeReady(true)
  }, [])

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark'] as const
    const cur = (theme ?? 'system') as (typeof order)[number]
    const i = Math.max(0, order.indexOf(cur))
    setTheme(order[(i + 1) % order.length])
  }

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
        <div className="flex min-h-16 flex-wrap items-center gap-x-2 gap-y-2 py-2 md:min-h-16 md:flex-nowrap md:py-2">
          <div
            className={cn('flex min-w-0 shrink-0 items-center rounded-lg select-none')}
            title={t('meta.appName')}
          >
            <FinancePilotLogo />
          </div>

          <div className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-1 md:flex">
            {simulatorNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={t(item.labelKey)}
                Icon={item.icon}
                active={navItemActive(pathname, item.href)}
              />
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <SimulatorAuthMenu />
            {pathname !== '/connexion' ? <SavedProjectsMenu /> : null}

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
                  {simulatorNavItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <NavLink
                        href={item.href}
                        label={t(item.labelKey)}
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
                  {sessionStatus === 'authenticated' && (
                    <div className="mt-4 border-t border-border pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setBurgerOpen(false)
                          void signOut({ callbackUrl: '/connexion' })
                        }}
                      >
                        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                        {t('auth.signOut')}
                      </Button>
                    </div>
                  )}
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
      </div>
    </nav>
  )
}
