'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { UI_LANGUAGE_OPTIONS, resolveUiLanguageCode } from '@/lib/ui-languages'
import { ClipboardList, GitCompare, Languages, LineChart, Menu, Monitor, Moon, Sun, Wallet } from 'lucide-react'
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

const mainNav = [
  { href: '/', key: 'navigation.data' as const, icon: ClipboardList },
  { href: '/estimations', key: 'navigation.estimates' as const, icon: LineChart },
]

export function Navigation() {
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center gap-3">
          <Link
            href="/"
            className={cn(
              'flex min-w-0 shrink-0 items-center gap-2 rounded-lg outline-none transition-opacity',
              'hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
            aria-label={t('navigation.data')}
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <LineChart className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-lg truncate max-[380px]:hidden sm:max-w-none">
              {t('meta.appName')}
            </span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {mainNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{t(item.key)}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <SavedProjectsMenu />

            <Sheet open={burgerOpen} onOpenChange={setBurgerOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" title={t('navigation.moreMenu')}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('navigation.moreMenu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-1rem,20rem)] sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>{t('navigation.moreMenu')}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-2 pb-6">
                  <SheetClose asChild>
                    <Link
                      href="/gestion-finances"
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        pathname === '/gestion-finances'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-secondary',
                      )}
                      onClick={() => setBurgerOpen(false)}
                    >
                      <Wallet className="h-5 w-5 shrink-0" />
                      {t('navigation.advancedFinance')}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/comparaison"
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        pathname === '/comparaison'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-secondary',
                      )}
                      onClick={() => setBurgerOpen(false)}
                    >
                      <GitCompare className="h-5 w-5 shrink-0" />
                      {t('navigation.comparison')}
                    </Link>
                  </SheetClose>

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
