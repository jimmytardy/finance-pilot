'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { UI_LANGUAGE_OPTIONS, resolveUiLanguageCode } from '@/lib/ui-languages'
import { ClipboardList, GitCompare, Languages, LineChart, Menu, Monitor, Moon, Sun, Wallet } from 'lucide-react'
import { FinancePilotLogo } from '@/components/finance-pilot-logo'
import { SavedProjectsMenu } from '@/components/saved-projects-menu'
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

const navItems = [
  { href: '/donnees', key: 'navigation.data' as const, icon: ClipboardList },
  { href: '/gestion-finances', key: 'navigation.advancedFinance' as const, icon: Wallet },
  { href: '/estimations', key: 'navigation.estimates' as const, icon: LineChart },
  { href: '/comparaison', key: 'navigation.comparison' as const, icon: GitCompare },
] as const

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
  Icon: (typeof navItems)[number]['icon']
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

export type NavigationVariant = 'full' | 'marketing'

export function Navigation({ variant = 'full' }: { variant?: NavigationVariant }) {
  const pathname = usePathname()
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

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  const currentLang = resolveUiLanguageCode(i18n.language)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-2 md:gap-3">
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

          {/* Pages : barre horizontale à partir du breakpoint md */}
          <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={t(item.key)}
                Icon={item.icon}
                active={pathname === item.href}
              />
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {variant === 'full' ? <SavedProjectsMenu /> : null}

            {/* Thème : visible sur desktop ; dans le menu burger sur mobile */}
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

            {/* Menu burger : petits écrans uniquement (masqué à partir de md) */}
            <Sheet open={burgerOpen} onOpenChange={setBurgerOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 md:hidden"
                  title={t('navigation.moreMenu')}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('navigation.moreMenu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-1rem,20rem)] sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>{t('navigation.moreMenu')}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-2 pb-6">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <NavLink
                        href={item.href}
                        label={t(item.key)}
                        Icon={item.icon}
                        active={pathname === item.href}
                        onNavigate={() => setBurgerOpen(false)}
                        className="py-3"
                      />
                    </SheetClose>
                  ))}
                  <div className="mt-3 border-t border-border pt-3">
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
                  className="h-9 w-9 shrink-0"
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
