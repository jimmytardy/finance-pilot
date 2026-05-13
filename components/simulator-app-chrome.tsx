'use client'

import type { ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SimulatorPersistenceBanner } from '@/components/simulator-persistence-banner'
import { SavedProjectsMenu } from '@/components/saved-projects-menu'
import {
  NavLink,
  SimulatorTopBar,
  navItemActive,
  salairesNavItems,
  simulatorNavItems,
} from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'

type NavSection = 'finances' | 'salaires'

const isFinancePath = (pathname: string) =>
  simulatorNavItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))

const isSalaryPath = (pathname: string) =>
  pathname === '/salaires' || pathname.startsWith('/salaires/')

export function SimulatorAppChrome({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const [section, setSection] = useState<NavSection>(() =>
    isSalaryPath(pathname) ? 'salaires' : 'finances',
  )

  useEffect(() => {
    if (isFinancePath(pathname)) setSection('finances')
    else if (isSalaryPath(pathname)) setSection('salaires')
  }, [pathname])

  const renderMobileNav = useCallback(
    (opts: { closeSheet: () => void }) => (
      <MobileNavBody router={router} section={section} onNavigate={opts.closeSheet} />
    ),
    [router, section],
  )

  if (status !== 'authenticated') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-dvh w-full">
      <aside
        className="hidden shrink-0 border-r border-border bg-muted/30 md:flex md:w-56 md:flex-col"
        aria-label={t('navigation.sidebarLabel')}
      >
        <div className="flex flex-col gap-1 p-3 pt-4">
          <SectionToggle
            active={section === 'finances'}
            label={t('navigation.sectionFinances')}
            onClick={() => {
              setSection('finances')
              router.push('/donnees')
            }}
          />
          <SectionToggle
            active={section === 'salaires'}
            label={t('navigation.sectionSalaries')}
            onClick={() => {
              setSection('salaires')
              router.push('/salaires/saisie')
            }}
          />
        </div>
        {section === 'finances' ? (
          <nav className="flex flex-col gap-1 border-t border-border p-3">
            {simulatorNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={t(item.labelKey)}
                Icon={item.icon}
                active={navItemActive(pathname, item.href)}
                className="w-full justify-start"
              />
            ))}
            <div className="pt-1">
              <SavedProjectsMenu variant="sidebar" />
            </div>
          </nav>
        ) : null}
        {section === 'salaires' ? (
          <nav className="flex flex-col gap-1 border-t border-border p-3">
            {salairesNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={t(item.labelKey)}
                Icon={item.icon}
                active={navItemActive(pathname, item.href)}
                className="w-full justify-start"
              />
            ))}
          </nav>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <SimulatorTopBar renderMobileNav={renderMobileNav} />
        <SimulatorPersistenceBanner />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

function SectionToggle({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

function MobileNavBody({
  router,
  section,
  onNavigate,
}: {
  router: { push: (href: string) => void }
  section: NavSection
  onNavigate: () => void
}) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { status: sessionStatus } = useSession()
  const { theme, setTheme } = useTheme()
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

  return (
    <>
      <div className="flex flex-col gap-2 border-b border-border px-2 pb-3">
        <p className="text-xs font-medium text-muted-foreground">{t('navigation.sectionsTitle')}</p>
        <div className="flex flex-col gap-1">
          <SectionToggle
            active={section === 'finances'}
            label={t('navigation.sectionFinances')}
            onClick={() => {
              onNavigate()
              router.push('/donnees')
            }}
          />
          <SectionToggle
            active={section === 'salaires'}
            label={t('navigation.sectionSalaries')}
            onClick={() => {
              onNavigate()
              router.push('/salaires/saisie')
            }}
          />
        </div>
      </div>
      {section === 'finances' ? (
        <nav className="flex flex-col gap-2 px-2 pb-4 pt-3">
          {simulatorNavItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <NavLink
                href={item.href}
                label={t(item.labelKey)}
                Icon={item.icon}
                active={navItemActive(pathname, item.href)}
                onNavigate={onNavigate}
                className="py-3.5"
              />
            </SheetClose>
          ))}
          <div className="px-0 pt-1">
            <SavedProjectsMenu variant="sidebar" />
          </div>
        </nav>
      ) : null}
      {section === 'salaires' ? (
        <nav className="flex flex-col gap-2 px-2 pb-4 pt-3">
          {salairesNavItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <NavLink
                href={item.href}
                label={t(item.labelKey)}
                Icon={item.icon}
                active={navItemActive(pathname, item.href)}
                onNavigate={onNavigate}
                className="py-3.5"
              />
            </SheetClose>
          ))}
        </nav>
      ) : null}
      <div className="mt-4 border-t border-border px-2 pt-4">
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
        <div className="mt-4 border-t border-border px-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              onNavigate()
              void signOut({ callbackUrl: '/connexion' })
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            {t('auth.signOut')}
          </Button>
        </div>
      )}
    </>
  )
}
